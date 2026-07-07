# Mongodb details:

main url:mongodb+srv://qas-app-rwuser:fSXQNZ7G9B38n4xi@quality-app.ss86w.mongodb.net/
 
database name: ktern-masterdb

collections :
1. kt_t_agent_analytics :
sample:
{
  "_id": {
    "$oid": "67e3f8a9c4d5e6f7a8b9c0d1"
  },
  "__originalid": "67e3f8a9c4d5e6f7a8b9c0d1",
  "__references": [],
  "title": "Document Generation (Production)",
  "sessionid": "67e3f8a9c4d5e6f7a8b9c0d1",
  "agentid": "698da5017cee6c7e4d5e8615",
  "userid": "5d6782afbcc93a5733493aa9",
  "projectid": "5f899ef4361c2a32badb17e6",
  "purpose": "doc_generation",
  "environment": "prd",
  "inputtokens": 2500,
  "outputtokens": 1200,
  "totaltokens": 3700,
  "cachereadtokens": 300,
  "cachewritetokens": 150,
  "status": "Completed",
  "createdby": "System",
  "createdon": "2025-07-06",
  "lasteditedby": "",
  "lasteditedon": "",
  "tags": [],
  "__workitemtype": "projects-agent-analytics"
}

this contains the all the values we have that we can use to calculate the values for the kpi

2. kt_m_users:
sample:
{
  "_id": {
    "$oid": "5e4247b7c9a48e75058f1490"
  },
  "email": "ajubinjacob@kaartech.com",
  "userID": "KU-006",
  "fullName": "Jubin Jacob Abraham",
  "mobileNo": "",
  "active": true,
  "aboutMe": "",
  "location": "",
  "registeredOn": {
    "$date": "2020-02-11T09:48:59.345Z"
  },
  "inviteStatus": "Accepted",
  "invitedBy": {
    "$oid": "5c291d5c1c9d44000015c4be"
  },
  "lastLogin": {
    "$date": "2020-02-11T09:49:14.906Z"
  },
  "reportingTo": "",
  "dailyUpdate": "",
  "eventNotification": "",
  "threadComments": "",
  "workItemAssigned": "",
  "workItemStatusUpdates": "",
  "JWTToken": "",
  "socketID": "",
  "orgID": {
    "$oid": "5c5495a11c9d4400008a1ce2"
  },
  "organizationType": "",
  "orgDomain": "quality",
  "verificationToken": "",
  "verifyEnc": {
    "existingUser": false,
    "orgDomain": "quality",
    "projectDetails": [
      {
        "_id": {
          "$oid": "5e40fb61a008b47894a8530d"
        },
        "refID": {
          "$oid": "5c5495a11c9d4400008a1ce2"
        },
        "projectID": "CONVERSION",
        "customerName": "Kaar Tech",
        "systemIntegrators": "KTern",
        "projectName": "KTern - S/4HANA Conversion",
        "projectType": "Conversion",
        "projectOverview": "The Sample Conversion Project",
        "projectMembers": [
          {
            "$oid": "5c291d5c1c9d44000015c4be"
          }
        ],
        "targetSAPProduct": "SAP S/4HANA On-Premise",
        "targetSAPVersion": "1909",
        "projectStartDate": "2020-02-01T06:43:01.977Z",
        "projectEndDate": "2020-02-08T06:43:01.977Z",
        "activateMethodology": true,
        "approvals": true,
        "lastEditedBy": {
          "$oid": "5c291d5c1c9d44000015c4be"
        },
        "projectScope": "",
        "projectDescription": "",
        "lastEditedOn": {
          "$date": "2020-02-10T06:42:41.064Z"
        },
        "createdBy": {
          "$oid": "5c291d5c1c9d44000015c4be"
        },
        "fileManagement": "Cloud",
        "createdOn": {
          "$date": "2020-02-10T06:42:41.064Z"
        },
        "dbURL": "mongodb+srv://sgokulnath:kdwsuser@ktern-init-n14ps.mongodb.net",
        "dbName": "kaartech-ks4c",
        "title": "Overview"
      }
    ],
    "randomString": "6UGrmJbZPBbdrQVyG6vt7QL9MLzRRnqD131",
    "project": "kaartech-ks4c",
    "dbURL": "mongodb+srv://sgokulnath:kdwsuser@ktern-init-n14ps.mongodb.net",
    "email": "ajubinjacob@kaartech.com"
  },
  "inviteEnc": {
    "projectName": "KTern - S/4HANA Conversion",
    "_id": {
      "$oid": "5e40fb61a008b47894a8530d"
    },
    "email": "ajubinjacob@kaartech.com"
  },
  "password": "$2a$10$4p4H5gtxL3IY6OdfiGc4v.eD.ZhEhj6YvEmrxqUW5ZyFIKe7NcOj6",
  "angularID": [
    null
  ],
  "ordDomain": "quality",
  "auditRole": null
}

the userid in the kt_t_agent_analytics will be mapped here to get the actual value[full name]

3. kt_m_masterAgents:
sample:
{
  "_id": {
    "$oid": "698da5017cee6c7e4d5e8615"
  },
  "name": "WRICEF Documentation Agent",
  "description": "Wricef Documentation Agent",
  "canvas": {
    "nodes": [
      {
        "id": "agent",
        "type": "custom",
        "position": {
          "x": 500,
          "y": 300
        },
        "data": {
          "label": "AGENT",
          "content": "WRICEF Documentation Agent",
          "icon": "🤖",
          "badge": null,
          "showEdit": false,
          "showAdd": false,
          "isCenter": true
        }
      },
      {
        "id": "mcp-1",
        "type": "custom",
        "position": {
          "x": 846,
          "y": 285
        },
        "data": {
          "label": "MCP SERVERS",
          "content": null,
          "icon": "🔌",
          "badge": "SAP",
          "showEdit": false,
          "showAdd": true,
          "isCenter": false
        }
      },
      {
        "id": "execution-2",
        "type": "custom",
        "position": {
          "x": 588,
          "y": 490
        },
        "data": {
          "label": "EXECUTION",
          "content": null,
          "icon": "▶️",
          "badge": null,
          "showEdit": false,
          "showAdd": true,
          "isCenter": false
        }
      },
      {
        "id": "prompts-3",
        "type": "custom",
        "position": {
          "x": 648,
          "y": 142
        },
        "data": {
          "label": "PROMPTS",
          "content": null,
          "icon": "💬",
          "badge": null,
          "showEdit": false,
          "showAdd": true,
          "isCenter": false
        }
      }
    ],
    "edges": [
      {
        "id": "edge-agent-mcp1",
        "source": "agent",
        "target": "mcp-1",
        "type": "smoothstep",
        "animated": true
      },
      {
        "id": "edge-agent-exec2",
        "source": "agent",
        "target": "execution-2",
        "type": "smoothstep",
        "animated": true
      },
      {
        "id": "edge-prompts3-agent",
        "source": "prompts-3",
        "target": "agent",
        "type": "smoothstep",
        "animated": true
      }
    ]
  },
  "agent_config": {
    "name": "WRICEF Documentation Agent",
    "description": "Wricef Documentation Agent",
    "version": "1.0.0",
    "components": [
      {
        "instance_id": "llm-001",
        "category": "LLM Providers",
        "component_id": "bedrock",
        "name": "Claude Sonnet on Bedrock",
        "enabled": true,
        "config": {
          "modelId": "anthropic.claude-3-5-sonnet-20241022-v2:0",
          "temperature": 0.7,
          "maxTokens": 4096,
          "topP": 0.9
        }
      },
      {
        "instance_id": "mcp-001",
        "category": "MCP Servers",
        "component_id": "abap-adt",
        "name": "SAP Quality System",
        "enabled": true,
        "config": {
          "endpoint": "https://quality.ktern.com"
        }
      },
      {
        "instance_id": "prompt-001",
        "category": "Prompts",
        "component_id": "system-prompt",
        "name": "System Prompt",
        "enabled": true,
        "config": {
          "role": "system",
          "content": "You are a WRICEF documentation agent.",
          "arnId": "arn:aws:bedrock:us-east-1:123456:prompt/ABC",
          "variables": []
        }
      },
      {
        "instance_id": "tool-001",
        "category": "Tools",
        "component_id": "code-analyzer",
        "name": "ABAP Code Analyzer",
        "enabled": true,
        "config": {
          "analysisDepth": "deep"
        }
      },
      {
        "instance_id": "guardrail-001",
        "category": "Guardrails",
        "component_id": "output-validator",
        "name": "Output Format Validator",
        "enabled": true,
        "config": {
          "type": "output_validation",
          "strictMode": true
        }
      },
      {
        "instance_id": "hook-001",
        "category": "Hooks",
        "component_id": "post-execution",
        "name": "Notify on Completion",
        "enabled": true,
        "config": {
          "event": "post_execution",
          "endpoint": "https://hooks.ktern.com/notify"
        }
      },
      {
        "instance_id": "memory-001",
        "category": "Memory",
        "component_id": "long-term",
        "name": "Long-term Memory",
        "enabled": true,
        "config": {
          "strategy": "long-term",
          "maxTokens": 128000,
          "chunkSize": 1000,
          "overlapSize": 200,
          "enableVectorStore": true
        }
      },
      {
        "instance_id": "exec-001",
        "category": "Execution",
        "component_id": "single",
        "name": "Single Topology",
        "enabled": true,
        "config": {
          "topology": "single",
          "maxIterations": 10,
          "timeoutMs": 300000,
          "parallelization": false,
          "streamingEnabled": true,
          "batchProcessing": {
            "enabled": false,
            "batchSize": 100
          }
        }
      },
      {
        "instance_id": "safety-001",
        "category": "Safety",
        "component_id": "default-safety",
        "name": "Default Safety",
        "enabled": true,
        "config": {
          "piiRedaction": {
            "enabled": false
          },
          "contentFiltering": {
            "enabled": false,
            "toxicityThreshold": 0.7
          },
          "rateLimit": {
            "enabled": false,
            "requestsPerMinute": 60
          },
          "dataRetention": {
            "enabled": false
          }
        }
      },
      {
        "instance_id": "obs-001",
        "category": "Observability",
        "component_id": "default-observability",
        "name": "Default Observability",
        "enabled": true,
        "config": {
          "metrics": {
            "enabled": true
          },
          "traces": {
            "enabled": true,
            "samplingRate": 1
          },
          "logs": {
            "enabled": true,
            "level": "info"
          }
        }
      }
    ]
  },
  "status": "draft",
  "is_active": true,
  "tags": [
    "wricef",
    "documentation"
  ],
  "category": "documentation",
  "version": 1,
  "created_at": {
    "$date": "2026-02-12T10:01:37.822Z"
  },
  "updated_at": {
    "$date": "2026-02-12T10:01:37.822Z"
  },
  "stats": {
    "active_instances": 0,
    "total_instances": 0
  }
}

the agentid in kt_t_agent_analytics will be mapped here to get the actual agent name [name]

4. kt_m_projects:
sample:
{
  "_id": {
    "$oid": "5f899ef4361c2a32badb17e6"
  },
  "refID": {
    "$oid": "5c5495a11c9d4400008a1ce2"
  },
  "projectID": "QAS",
  "customerName": [
    "KTern Team"
  ],
  "systemIntegrators": [
    "KTern.AI"
  ],
  "projectName": "SAP ERP Transformation",
  "projectType": "Conversion",
  "projectOverview": "SAP S/4HANA System Conversion",
  "projectMembers": [
    {
      "$oid": "5ccea0fb6d01b0599e0f1d47"
    },
    {
      "$oid": "5d4bbe298531e6098b9a1f6a"
    },
    {
      "$oid": "5d4bbe298531e6098b9a1f6a"
    },
    {
      "$oid": "5c82bb89dbcb95c858435346"
    },
    {
      "$oid": "5c82bb89dbcb95c858435346"
    },
    {
      "$oid": "5c82bb89dbcb95c858435346"
    },
    {
      "$oid": "5c291d5c1c9d44000015c4be"
    },
    {
      "$oid": "5c291d5c1c9d44000015c4be"
    },
    {
      "$oid": "5c291d5c1c9d44000015c4be"
    },
    {
      "$oid": "5c7a258a12d9dd0635c11681"
    },
    {
      "$oid": "5c7a258a12d9dd0635c11681"
    },
    {
      "$oid": "5c7a258a12d9dd0635c11681"
    },
    {
      "$oid": "5c7a258a12d9dd0635c11681"
    },
    {
      "$oid": "5c7a258a12d9dd0635c11681"
    },
    {
      "$oid": "5d931c0429db1b25ab4efb8a"
    },
    {
      "$oid": "5d8b057e0e7d3b303196a3af"
    },
    {
      "$oid": "5d8b057e0e7d3b303196a3af"
    },
    {
      "$oid": "5d8b057e0e7d3b303196a3af"
    },
    {
      "$oid": "5f89d7709a6048433ac80e95"
    },
    {
      "$oid": "5f8fd24193dd2d2b54599d56"
    },
    {
      "$oid": "603cc6e1f8bea747013e5a5f"
    },
    {
      "$oid": "611260ba52afeb394163c66d"
    },
    {
      "$oid": "611260ba52afeb394163c66d"
    },
    {
      "$oid": "611260ba52afeb394163c66d"
    },
    {
      "$oid": "611260ba52afeb394163c66d"
    },
    {
      "$oid": "62a3569a1fd12a0dd40d888f"
    },
    {
      "$oid": "62a3569a1fd12a0dd40d888f"
    },
    {
      "$oid": "625ea387f3cf535d136a6dc5"
    },
    {
      "$oid": "625ea387f3cf535d136a6dc5"
    },
    {
      "$oid": "62bb456c645da90f423801db"
    },
    {
      "$oid": "62bb456c645da90f423801db"
    },
    {
      "$oid": "6303c3e5cc545ceeb8db370d"
    },
    {
      "$oid": "6303c3e5cc545ceeb8db370d"
    },
    {
      "$oid": "6303c3e5cc545ceeb8db370d"
    },
    {
      "$oid": "630dee86c4db1653d8785d75"
    },
    {
      "$oid": "630e1bedc4db1653d8785d76"
    },
    {
      "$oid": "630e1bedc4db1653d8785d76"
    },
    {
      "$oid": "628be71b0ee91f4778165b7f"
    },
    {
      "$oid": "63172e9e9794369b32b598d7"
    },
    {
      "$oid": "61cb043763429e5ae0ee7885"
    },
    {
      "$oid": "61cb043763429e5ae0ee7885"
    },
    {
      "$oid": "61cb043763429e5ae0ee7885"
    },
    {
      "$oid": "645e1f52b26204487cbb92fa"
    },
    {
      "$oid": "645e1f52b26204487cbb92fa"
    },
    {
      "$oid": "645e1f52b26204487cbb92fa"
    },
    {
      "$oid": "64757989e11f75706a983afb"
    },
    {
      "$oid": "647588cae11f75706a983b04"
    },
    {
      "$oid": "6475f7322769f2249615c45f"
    },
    {
      "$oid": "6475f7322769f2249615c45f"
    },
    {
      "$oid": "6475f7322769f2249615c45f"
    },
    {
      "$oid": "6475f7322769f2249615c45f"
    },
    {
      "$oid": "6475f7322769f2249615c45f"
    },
    {
      "$oid": "6475f7322769f2249615c45f"
    },
    {
      "$oid": "6475f7322769f2249615c45f"
    },
    {
      "$oid": "6475f7322769f2249615c45f"
    },
    {
      "$oid": "6475f7322769f2249615c45f"
    },
    {
      "$oid": "6475f7322769f2249615c45f"
    },
    {
      "$oid": "6475f7322769f2249615c45f"
    },
    {
      "$oid": "6475f7322769f2249615c45f"
    },
    {
      "$oid": "6475f7322769f2249615c45f"
    },
    {
      "$oid": "6475f7322769f2249615c45f"
    },
    {
      "$oid": "6475f7322769f2249615c45f"
    },
    {
      "$oid": "635bada9af5a2cf9a86cb77c"
    },
    {
      "$oid": "635bada9af5a2cf9a86cb77c"
    },
    {
      "$oid": "635bada9af5a2cf9a86cb77c"
    },
    {
      "$oid": "6352c00992fc298bb09e6cb4"
    },
    {
      "$oid": "6352c00992fc298bb09e6cb4"
    },
    {
      "$oid": "6352c00992fc298bb09e6cb4"
    },
    {
      "$oid": "6352c00992fc298bb09e6cb4"
    },
    {
      "$oid": "6352c00992fc298bb09e6cb4"
    },
    {
      "$oid": "6352c00992fc298bb09e6cb4"
    },
    {
      "$oid": "6352c00992fc298bb09e6cb4"
    },
    {
      "$oid": "61cb043763429e5ae0ee7885"
    },
    {
      "$oid": "61cb043763429e5ae0ee7885"
    },
    {
      "$oid": "61cb043763429e5ae0ee7885"
    },
    {
      "$oid": "61cb043763429e5ae0ee7885"
    },
    {
      "$oid": "61cb043763429e5ae0ee7885"
    },
    {
      "$oid": "61cb043763429e5ae0ee7885"
    },
    {
      "$oid": "62a1f4e21cd2f76f00b4515c"
    },
    {
      "$oid": "62a1f4e21cd2f76f00b4515c"
    },
    {
      "$oid": "62a1f4e21cd2f76f00b4515c"
    },
    {
      "$oid": "62a1f4e21cd2f76f00b4515c"
    },
    {
      "$oid": "62a1f4e21cd2f76f00b4515c"
    },
    {
      "$oid": "65ce82f9f242cf4a5c1d9aa0"
    },
    {
      "$oid": "65ce82f9f242cf4a5c1d9aa0"
    },
    {
      "$oid": "65ce82f9f242cf4a5c1d9aa0"
    },
    {
      "$oid": "65ce82f9f242cf4a5c1d9aa0"
    },
    {
      "$oid": "65ce82f9f242cf4a5c1d9aa0"
    },
    {
      "$oid": "65ce82f9f242cf4a5c1d9aa0"
    },
    {
      "$oid": "62a1f4e21cd2f76f00b4515c"
    },
    {
      "$oid": "62a1f4e21cd2f76f00b4515c"
    },
    {
      "$oid": "62a1f4e21cd2f76f00b4515c"
    },
    {
      "$oid": "65ce82f9f242cf4a5c1d9aa0"
    },
    {
      "$oid": "65caf88fbe579821637c7685"
    },
    {
      "$oid": "65caf88fbe579821637c7685"
    }
  ],
  "targetSAPProduct": "SAP S/4HANA On-Premise",
  "targetSAPVersion": "1909",
  "projectStartDate": "2020-10-22T00:00:00.000Z",
  "projectEndDate": "2025-02-26T00:00:00.000Z",
  "activateMethodology": true,
  "approvals": true,
  "lastEditedBy": {
    "$oid": "5ccea0fb6d01b0599e0f1d47"
  },
  "projectScope": "",
  "projectDescription": "",
  "subscription": true,
  "lastEditedOn": {
    "$date": "2024-01-22T07:43:07.140Z"
  },
  "createdBy": {
    "$oid": "5ccea0fb6d01b0599e0f1d47"
  },
  "disableActualDates": true,
  "fileManagement": "Cloud",
  "skipHolidays": false,
  "createdOn": {
    "$date": "2020-10-16T13:24:02.953Z"
  },
  "integrations": {
    "status": true,
    "hours": 6,
    "timezone": "Europe/Rome",
    "microsoftteams": "https://outlook.office.com/webhook/17625027-3a57-452d-8c20-68267bb1abb6@87a25c2a-2cb4-4c40-9cbc-5268c0ed1eeb/IncomingWebhook/c686c014a7334272b51ef9c6e759dd3f/fcdf7932-b87e-4b95-a419-a6033d214d12",
    "googlechat": "https://chat.googleapis.com/v1/spaces/AAAAqrwOrrw/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=9K4BXCpjJ5dck9R3mkj7Q1z5IQczxexqn0YMt87J2Hw%3D"
  },
  "overdueAlerts": {
    "status": true,
    "hours": 4,
    "timezone": "Europe/Rome"
  },
  "dbURL": "mongodb+srv://qas-app-rwuser:fSXQNZ7G9B38n4xi@quality-app.ss86w.mongodb.net",
  "dbName": "kternteam-ss4sc",
  "title": "Overview",
  "signoffRestrictions": false,
  "organizations": [
    "KTern Team",
    "KTern.AI"
  ],
  "hasSubPhase": true,
  "hasSubPhases": true
}
the projectid in kt_t_agent_analytics will be mapped here to get the actaul project name[projectName]

