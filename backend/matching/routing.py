import os
import requests
import polyline

MAPBOX_ACCESS_TOKEN = os.getenv("MAPBOX_ACCESS_TOKEN")

def get_mapbox_route(start_lon: float, start_lat: float, dest_lon: float, dest_lat: float) -> tuple[list[tuple[float, float]], float, float]:
    """
    Calls Mapbox directions API.
    Returns (polyline_coordinates, distance_meters, duration_seconds)
    polyline_coordinates is a list of (lat, lon) tuples.
    """
    if not MAPBOX_ACCESS_TOKEN:
        # Fallback to straight line if no Mapbox token is configured
        return [(start_lat, start_lon), (dest_lat, dest_lon)], 0.0, 0.0

    url = f"https://api.mapbox.com/directions/v5/mapbox/driving/{start_lon},{start_lat};{dest_lon},{dest_lat}"
    params = {
        "access_token": MAPBOX_ACCESS_TOKEN,
        "geometries": "polyline",
        "overview": "full"
    }

    try:
        response = requests.get(url, params=params, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        if data.get("code") != "Ok" or not data.get("routes"):
            # Fallback
            return [(start_lat, start_lon), (dest_lat, dest_lon)], 0.0, 0.0

        route = data["routes"][0]
        encoded_polyline = route["geometry"]
        distance = route.get("distance", 0.0)
        duration = route.get("duration", 0.0)
        
        # polyline.decode returns list of (lat, lon)
        coords = polyline.decode(encoded_polyline)
        return coords, distance, duration
    except Exception:
        # Graceful fallback on network error or missing credentials
        return [(start_lat, start_lon), (dest_lat, dest_lon)], 0.0, 0.0

def geocode_address(address: str) -> tuple[float, float]:
    """
    Converts a string address into (lat, lon) using Mapbox Geocoding API.
    Returns (0.0, 0.0) on failure.
    """
    if not MAPBOX_ACCESS_TOKEN or not address:
        return 0.0, 0.0

    url = f"https://api.mapbox.com/geocoding/v5/mapbox.places/{address}.json"
    params = {
        "access_token": MAPBOX_ACCESS_TOKEN,
        "limit": 1
    }

    try:
        response = requests.get(url, params=params, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        if not data.get("features"):
            return 0.0, 0.0

        # Mapbox returns coordinates as [longitude, latitude]
        lon, lat = data["features"][0]["center"]
        return float(lat), float(lon)
    except Exception:
        return 0.0, 0.0
