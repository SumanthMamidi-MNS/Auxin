"""
app/services/eta_service.py
===========================
Centralized ETA estimation engine for Auxin V3.0.

Calculates dynamic, progressive arrival estimates based on:
  - Courier GPS coordinates
  - Farm pickup coordinates
  - Customer destination coordinates
  - Current delivery lifecycle state
  - Conservative urban transit speeds and handoff buffers

Returns human-friendly time ranges (e.g. "12–18 min", "Expected around 6:45 PM")
without misleading false precision.
"""

from datetime import datetime, timedelta, timezone
from app.core.geolocation import haversine_distance_km


# Standard urban travel parameters
URBAN_SPEED_KMH = 22.0          # Average 2-wheeler courier speed in city traffic
PICKUP_HANDLING_MINUTES = 5.0   # Farm packing & verification buffer
DOORSTEP_BUFFER_MINUTES = 3.0   # Gate access, parking, and OTP exchange buffer


class ETAService:
    @staticmethod
    def calculate_delivery_eta(
        *,
        status: str,
        partner_lat: float | None,
        partner_lon: float | None,
        farm_lat: float | None,
        farm_lon: float | None,
        customer_lat: float | None,
        customer_lon: float | None,
    ) -> dict:
        """
        Computes dynamic ETA based on current delivery status and available GPS coordinates.

        Returns:
            {
                "status": status,
                "estimated_minutes_min": int,
                "estimated_minutes_max": int,
                "formatted_eta": str,       # e.g. "15–20 min"
                "expected_time": str,       # e.g. "06:45 PM"
                "distance_to_target_km": float | None,
                "target_type": str          # "farm", "customer", or "delivered"
            }
        """
        now = datetime.now(tz=timezone.utc)

        if status == "delivered":
            return {
                "status": "delivered",
                "estimated_minutes_min": 0,
                "estimated_minutes_max": 0,
                "formatted_eta": "Delivered",
                "expected_time": now.strftime("%I:%M %p"),
                "distance_to_target_km": 0.0,
                "target_type": "delivered",
            }

        # 1. Calculate leg distances
        dist_partner_to_farm = 0.0
        if partner_lat is not None and partner_lon is not None and farm_lat is not None and farm_lon is not None:
            dist_partner_to_farm = haversine_distance_km(partner_lat, partner_lon, farm_lat, farm_lon)

        dist_farm_to_cust = 0.0
        if farm_lat is not None and farm_lon is not None and customer_lat is not None and customer_lon is not None:
            dist_farm_to_cust = haversine_distance_km(farm_lat, farm_lon, customer_lat, customer_lon)

        dist_partner_to_cust = 0.0
        if partner_lat is not None and partner_lon is not None and customer_lat is not None and customer_lon is not None:
            dist_partner_to_cust = haversine_distance_km(partner_lat, partner_lon, customer_lat, customer_lon)

        # 2. Stage-based time estimation
        if status in ["pending", "assigned", "accepted"]:
            # Courier heading to farm + pickup handoff + transit to customer
            time_to_farm = (dist_partner_to_farm / URBAN_SPEED_KMH) * 60.0 if dist_partner_to_farm > 0 else 8.0
            time_to_cust = (dist_farm_to_cust / URBAN_SPEED_KMH) * 60.0 if dist_farm_to_cust > 0 else 15.0

            total_min = time_to_farm + PICKUP_HANDLING_MINUTES + time_to_cust + DOORSTEP_BUFFER_MINUTES
            target_type = "farm"
            target_dist = dist_partner_to_farm

        elif status == "picked_up":
            # Courier picked up from farm, preparing to start ride to customer
            time_to_cust = (dist_farm_to_cust / URBAN_SPEED_KMH) * 60.0 if dist_farm_to_cust > 0 else 15.0
            total_min = time_to_cust + DOORSTEP_BUFFER_MINUTES + 2.0
            target_type = "customer"
            target_dist = dist_farm_to_cust

        elif status == "out_for_delivery":
            # Courier actively in transit to customer
            time_to_cust = (dist_partner_to_cust / URBAN_SPEED_KMH) * 60.0 if dist_partner_to_cust > 0 else (
                (dist_farm_to_cust / URBAN_SPEED_KMH) * 60.0 if dist_farm_to_cust > 0 else 12.0
            )
            total_min = time_to_cust + DOORSTEP_BUFFER_MINUTES
            target_type = "customer"
            target_dist = dist_partner_to_cust if dist_partner_to_cust > 0 else dist_farm_to_cust

        else:
            total_min = 20.0
            target_type = "customer"
            target_dist = None

        # 3. Create realistic conservative range
        min_mins = max(5, int(total_min * 0.85))
        max_mins = max(min_mins + 5, int(total_min * 1.25) + 3)

        expected_arrival = now + timedelta(minutes=int((min_mins + max_mins) / 2))

        return {
            "status": status,
            "estimated_minutes_min": min_mins,
            "estimated_minutes_max": max_mins,
            "formatted_eta": f"{min_mins}–{max_mins} min",
            "expected_time": expected_arrival.strftime("%I:%M %p"),
            "distance_to_target_km": round(target_dist, 1) if target_dist is not None else None,
            "target_type": target_type,
        }
