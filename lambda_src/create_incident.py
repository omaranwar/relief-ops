import json
import time

def lambda_handler(event, context):
    body = json.loads(event.get("body", "{}"))
    incident_id = "inc-" + body.get("region", "unknown")

    incident = {
        "id": incident_id,
        "region": body.get("region", "unknown"),
        "type": body.get("type", "unknown"),
        "priority": body.get("priority", "Medium"),
        "status": body.get("status", "open"),
        "etaSummary": "3h",
        "lastUpdated": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "lat": body.get("lat"),
        "lon": body.get("lon")
    }

    return {
        "statusCode": 200,
        "body": json.dumps({
            "message": "Incident created",
            "incident": incident
        })
    }
