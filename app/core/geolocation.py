"""
app/core/geolocation.py
========================
Haversine-based geolocation utilities.

The Haversine formula computes the great-circle distance between two points
on a sphere (Earth) given their latitudes and longitudes in decimal degrees.

Accuracy:
  Good enough for hyperlocal (< 5 km) delivery radius checks.  The formula
  assumes a spherical Earth (radius 6,371,000 m) which introduces ≈ 0.5%
  error — acceptable for a 100-metre geofence.

No external dependencies — pure Python math.
"""

import math

# Mean radius of the Earth in metres (WGS-84 approximation)
_EARTH_RADIUS_METRES = 6_371_000.0


def haversine_distance(
    lat1: float,
    lon1: float,
    lat2: float,
    lon2: float,
) -> float:
    """
    Compute the straight-line distance (in metres) between two GPS coordinates.

    Parameters:
        lat1, lon1 – first point (decimal degrees, WGS-84)
        lat2, lon2 – second point (decimal degrees, WGS-84)

    Returns:
        Distance in metres (float).
    """
    # Convert decimal degrees to radians
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lam = math.radians(lon2 - lon1)

    a = (
        math.sin(d_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(d_lam / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return _EARTH_RADIUS_METRES * c


def is_within_radius(
    partner_lat: float,
    partner_lon: float,
    destination_lat: float,
    destination_lon: float,
    radius_metres: float,
) -> bool:
    """
    Return True if the delivery partner is within `radius_metres` of the
    delivery destination.
    """
    distance = haversine_distance(
        partner_lat, partner_lon,
        destination_lat, destination_lon,
    )
    return distance <= radius_metres
