import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Optional filters from URL if we want to pass them directly to Mongo
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    const client = await clientPromise
    const db = client.db('ktern-masterdb')
    const collection = db.collection('kt_t_agent_analytics')

    const matchStage: any = {}
    
    if (startDate || endDate) {
      matchStage.createdon = {}
      if (startDate) matchStage.createdon.$gte = startDate
      if (endDate) matchStage.createdon.$lte = endDate
    }

    const pipeline: any[] = []

    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage })
    }

    pipeline.push(
      {
        $addFields: {
          // Convert string IDs to ObjectIds to match the foreign collections
          // Handle cases where the fields might be missing or invalid by defaulting
          userObjId: { $convert: { input: "$userid", to: "objectId", onError: null, onNull: null } },
          projectObjId: { $convert: { input: "$projectid", to: "objectId", onError: null, onNull: null } },
          agentObjId: { $convert: { input: "$agentid", to: "objectId", onError: null, onNull: null } }
        }
      },
      {
        $lookup: {
          from: "kt_m_users",
          localField: "userObjId",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      {
        $lookup: {
          from: "kt_m_projects",
          localField: "projectObjId",
          foreignField: "_id",
          as: "projectDetails"
        }
      },
      {
        $lookup: {
          from: "kt_m_masterAgents",
          localField: "agentObjId",
          foreignField: "_id",
          as: "agentDetails"
        }
      },
      { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$projectDetails", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$agentDetails", preserveNullAndEmptyArrays: true } },
      {
        // Group by sessionid to calculate distinct run metrics and roll up tokens
          $group: {
            _id: "$sessionid",
            agentid: { $first: "$agentid" },
            agentName: { $first: "$agentDetails.name" },
            userid: { $first: "$userid" },
            userFullName: { $first: "$userDetails.fullName" },
            userEmail: { $first: "$userDetails.email" },
            userDomain: { $first: "$userDetails.orgDomain" },
            projectid: { $first: "$projectid" },
            projectName: { $first: "$projectDetails.projectName" },
            purpose: { $first: "$purpose" },
            environment: { $first: "$environment" },
            date: { $first: "$createdon" },
            model: { $first: "$model" },
            inputTokens: { $sum: { $ifNull: ["$inputtokens", 0] } },
            outputTokens: { $sum: { $ifNull: ["$outputtokens", 0] } },
            totalTokens: { $sum: { $ifNull: ["$totaltokens", 0] } },
            cacheReadTokens: { $sum: { $ifNull: ["$cachereadtokens", 0] } },
            cacheWriteTokens: { $sum: { $ifNull: ["$cachewritetokens", 0] } },
            status: { $first: "$status" }
          }
      },
      {
        // Lookup model pricing and calculate cost dynamically
        $lookup: {
          from: "m_bedrockmodel_pricing",
          localField: "model",
          foreignField: "model_id",
          as: "modelPricing"
        }
      },
      { $unwind: { path: "$modelPricing", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          cost: {
            $add: [
               { $multiply: [ { $divide: ["$inputTokens", 1000000] }, { $ifNull: ["$modelPricing.pricing.input", 0] } ] },
               { $multiply: [ { $divide: ["$outputTokens", 1000000] }, { $ifNull: ["$modelPricing.pricing.output", 0] } ] },
               { $multiply: [ { $divide: ["$cacheReadTokens", 1000000] }, { $ifNull: ["$modelPricing.pricing.cache_read", 0] } ] },
               { $multiply: [ { $divide: ["$cacheWriteTokens", 1000000] }, { $ifNull: ["$modelPricing.pricing.cache_write", 0] } ] }
            ]
          }
        }
      },
      {
        $project: {
          _id: 0,
          sessionId: { $ifNull: ["$_id", "Unknown-Session"] },
          agentId: { $ifNull: ["$agentid", "Unknown-Agent-ID"] },
          agentName: { $ifNull: ["$agentName", "Unknown Agent"] },
          user: { $ifNull: ["$userFullName", "Unknown User"] },
          email: { $ifNull: ["$userEmail", "unknown@example.com"] },
          domain: { $ifNull: ["$userDomain", "unknown"] },
          projectId: { $ifNull: ["$projectid", "Unknown-Project-ID"] },
          projectName: { $ifNull: ["$projectName", "Unknown Project"] },
          purpose: { $ifNull: ["$purpose", "general"] },
          environment: { $ifNull: ["$environment", "dev"] },
          date: { $ifNull: ["$date", new Date().toISOString().split('T')[0]] },
          model: { $ifNull: ["$model", "unknown"] },
          inputTokens: "$inputTokens",
          outputTokens: "$outputTokens",
          totalTokens: "$totalTokens",
          status: { $ifNull: ["$status", "Completed"] },
          cost: "$cost"
        }
      }
    )

    const results = await collection.aggregate(pipeline).toArray()

    return NextResponse.json({
      status_code: 200,
      count: results.length,
      users_extended: results
    })

  } catch (error: any) {
    console.error("API Error fetching AI Agents Analytics:", error)
    return NextResponse.json(
      { status_code: 500, detail: error.message },
      { status: 500 }
    )
  }
}
