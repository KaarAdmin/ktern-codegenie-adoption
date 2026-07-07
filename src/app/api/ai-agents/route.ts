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
          
          inputTokens: { $sum: { $ifNull: ["$inputtokens", 0] } },
          outputTokens: { $sum: { $ifNull: ["$outputtokens", 0] } },
          totalTokens: { $sum: { $ifNull: ["$totaltokens", 0] } },
          cacheReadTokens: { $sum: { $ifNull: ["$cachereadtokens", 0] } },
          cacheWriteTokens: { $sum: { $ifNull: ["$cachewritetokens", 0] } },
          status: { $first: "$status" }
        }
      },
      {
        // Calculate hardcoded costs (Claude 3.5 Sonnet approximations)
        $addFields: {
          cost: {
            $add: [
              { $multiply: ["$inputTokens", 0.000003] },
              { $multiply: ["$outputTokens", 0.000015] },
              { $multiply: ["$cacheReadTokens", 0.0000003] },
              { $multiply: ["$cacheWriteTokens", 0.00000375] }
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
          inputTokens: 1,
          outputTokens: 1,
          totalTokens: 1,
          status: { $ifNull: ["$status", "Completed"] },
          cost: 1
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
