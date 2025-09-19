import json

def lambda_handler(event, context):
    incidents = [
        {
            "id": "inc-1",
            "region": "London",
            "type": "Flood",
            "priority": "High",
            "status": "open",
            "etaSummary": "2h",
            "lastUpdated": "2025-09-19T10:00:00Z",
            "lat": 51.5074,
            "lon": -0.1278
        },
        {
            "id": "inc-2",
            "region": "Paris",
            "type": "Earthquake",
            "priority": "Low",
            "status": "resolved",
            "etaSummary": "6h",
            "lastUpdated": "2025-09-18T18:00:00Z",
            "lat": 48.8566,
            "lon": 2.3522
        }
    ]

    return {
        "statusCode": 200,
        "body": json.dumps(incidents)
    }
