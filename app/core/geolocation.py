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
    """
    return haversine_distance_km(lat1, lon1, lat2, lon2) * 1000.0


def haversine_distance_km(
    lat1: float,
    lon1: float,
    lat2: float,
    lon2: float,
) -> float:
    """
    Compute the straight-line distance (in kilometres) between two GPS coordinates
    using the spherical law of cosines / Haversine formula.

    Parameters:
        lat1, lon1 – first point (decimal degrees, WGS-84)
        lat2, lon2 – second point (decimal degrees, WGS-84)

    Returns:
        Distance in kilometres (float, rounded to 3 decimal places).
    """
    # Validate coordinate ranges
    lat1, lon1 = validate_coordinates(lat1, lon1)
    lat2, lon2 = validate_coordinates(lat2, lon2)

    # Convert decimal degrees to radians
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lam = math.radians(lon2 - lon1)

    a = (
        math.sin(d_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(d_lam / 2) ** 2
    )
    # Clip numerical precision error
    a = min(1.0, max(0.0, a))
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    distance_m = _EARTH_RADIUS_METRES * c
    return round(distance_m / 1000.0, 3)


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


def is_within_radius_km(
    lat1: float,
    lon1: float,
    lat2: float,
    lon2: float,
    radius_km: float,
) -> bool:
    """
    Return True if point 1 is within `radius_km` kilometres of point 2.
    """
    distance = haversine_distance_km(lat1, lon1, lat2, lon2)
    return distance <= radius_km


def validate_coordinates(lat: float, lon: float) -> tuple[float, float]:
    """
    Validates that latitude and longitude are valid numeric floats within:
      - Latitude: [-90.0, 90.0]
      - Longitude: [-180.0, 180.0]

    Raises:
        ValueError if coordinates are out of bounds or non-finite.
    """
    try:
        lat_f = float(lat)
        lon_f = float(lon)
    except (TypeError, ValueError) as e:
        raise ValueError(f"Invalid coordinate format: lat={lat!r}, lon={lon!r}") from e

    if math.isnan(lat_f) or math.isinf(lat_f) or math.isnan(lon_f) or math.isinf(lon_f):
        raise ValueError(f"Coordinates must be finite numbers: lat={lat_f}, lon={lon_f}")

    if not (-90.0 <= lat_f <= 90.0):
        raise ValueError(f"Latitude out of bounds [-90.0, 90.0]: {lat_f}")

    if not (-180.0 <= lon_f <= 180.0):
        raise ValueError(f"Longitude out of bounds [-180.0, 180.0]: {lon_f}")

    return lat_f, lon_f

