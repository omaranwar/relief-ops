import json

def lambda_handler(event, context):
    plan = {
        "planId": "plan123",
        "incidentId": "inc-1",
        "region": "London",
        "routes": [
            {"vehicleId": "veh-1", "from": "Depot A", "to": "Area X", "etaMinutes": 120},
            {"vehicleId": "veh-2", "from": "Depot B", "to": "Area Y", "etaMinutes": 180}
        ],
        "allocations": [
            {"resource": "Water", "quantity": 100, "unit": "bottles", "fromDepot": "Depot A", "toZones": ["Area X"]},
            {"resource": "Food", "quantity": 50, "unit": "boxes", "fromDepot": "Depot B", "toZones": ["Area Y"]}
        ],
        "sitrep": "Deployment in progress, 2 vehicles dispatched."
    }

    return {
        "statusCode": 200,
        "body": json.dumps(plan)
    }
