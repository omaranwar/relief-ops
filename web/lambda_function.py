import os, json, boto3
from decimal import Decimal

INCIDENT_TABLE = os.environ.get("INCIDENT_TABLE", "reliefops-Incidents")
PLAN_TABLE = os.environ.get("PLAN_TABLE", "reliefops-PlansAndAllocations")

ddb = boto3.resource("dynamodb")
inc_table = ddb.Table(INCIDENT_TABLE)

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,x-api-key",
    "Content-Type": "application/json",
}

def _num(x):
    if isinstance(x, Decimal):
        return float(x)
    return x

def lambda_handler(event, context):
    try:
        # Scan all incidents
        items = []
        resp = inc_table.scan()
        items.extend(resp.get("Items", []))
        while "LastEvaluatedKey" in resp:
            resp = inc_table.scan(ExclusiveStartKey=resp["LastEvaluatedKey"])
            items.extend(resp.get("Items", []))

        active = 0
        people = 0
        etas = []

        for it in items:
            status = (it.get("status") or "").lower()
            if status != "closed":
                active += 1
            pa = it.get("peopleAffected")
            if isinstance(pa, (int, float, Decimal)):
                people += int(_num(pa))
            eta = it.get("etaMinutes")
            if isinstance(eta, (int, float, Decimal)):
                etas.append(float(_num(eta)))

        avg_eta = round(sum(etas)/len(etas)) if etas else None

        body = {
            "activeIncidents": active,
            "peopleAffected": people,
            "unitsAvailable": None,
            "avgEtaMinutes": avg_eta
        }

        return {"statusCode": 200, "headers": CORS, "body": json.dumps(body)}
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": CORS,
            "body": json.dumps({"error": str(e)}),
        }
