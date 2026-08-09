import h3
from math import radians, cos, sin, asin, sqrt

# H3 resolution 9 is roughly 0.1km^2 area (edge length ~174m)
H3_RESOLUTION = 9
# Default threshold for geographic filtering
DEFAULT_PROXIMITY_THRESHOLD_KM = 5.0

def get_h3_cell(lat: float, lon: float, resolution: int = H3_RESOLUTION) -> str:
    """Returns the H3 cell string for a given lat/lon."""
    return h3.latlng_to_cell(lat, lon, resolution)

def get_route_corridor(polyline_coords: list[tuple[float, float]], resolution: int = H3_RESOLUTION, k_rings: int = 1) -> list[str]:
    """
    Given a list of coordinates (lat, lon) from a route,
    returns a deduplicated set of H3 cells covering the route and its neighbors.
    """
    corridor = set()
    for lat, lon in polyline_coords:
        cell = h3.latlng_to_cell(lat, lon, resolution)
        # Add the cell itself and its immediate neighbors (k_rings)
        neighbors = h3.grid_disk(cell, k_rings)
        corridor.update(neighbors)
    return list(corridor)

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance in kilometers between two points."""
    R = 6371.0  # Earth radius in kilometers

    dLat = radians(lat2 - lat1)
    dLon = radians(lon2 - lon1)
    lat1 = radians(lat1)
    lat2 = radians(lat2)

    a = sin(dLat / 2)**2 + cos(lat1) * cos(lat2) * sin(dLon / 2)**2
    c = 2 * asin(sqrt(a))
    return R * c
