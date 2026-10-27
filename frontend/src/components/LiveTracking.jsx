import React, { useState, useEffect } from 'react'
import { LoadScript, GoogleMap, Marker } from '@react-google-maps/api'

const containerStyle = {
    width: '100%',
    height: '100%',
};

const center = {
    lat: 28.6139,
    lng: 77.2090
};

const LiveTracking = () => {
    const [ currentPosition, setCurrentPosition ] = useState(center);
    const googleApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const hasValidGoogleKey = Boolean(
        googleApiKey && 
        googleApiKey.length > 15 && 
        !googleApiKey.includes('your_google_maps_api_key')
    );

    useEffect(() => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setCurrentPosition({
                        lat: latitude,
                        lng: longitude
                    });
                },
                (err) => console.log('Geolocation permission denied or unavailable, using default coords.', err),
                { enableHighAccuracy: true }
            );

            const watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setCurrentPosition({
                        lat: latitude,
                        lng: longitude
                    });
                },
                (err) => console.log('WatchPosition error', err),
                { enableHighAccuracy: true }
            );

            return () => navigator.geolocation.clearWatch(watchId);
        }
    }, []);

    // If Google Maps API key is provided and valid, use Google Maps
    if (hasValidGoogleKey) {
        return (
            <LoadScript googleMapsApiKey={googleApiKey}>
                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={currentPosition}
                    zoom={15}
                >
                    <Marker position={currentPosition} />
                </GoogleMap>
            </LoadScript>
        );
    }

    // Free Live Interactive Map (OpenStreetMap) - No Google Cloud Billing Required!
    const delta = 0.012;
    const minLng = (currentPosition.lng - delta).toFixed(5);
    const minLat = (currentPosition.lat - delta).toFixed(5);
    const maxLng = (currentPosition.lng + delta).toFixed(5);
    const maxLat = (currentPosition.lat + delta).toFixed(5);

    return (
        <div className='w-full h-full relative overflow-hidden bg-gray-100'>
            <iframe
                title="Live Map Tracking"
                className='w-full h-full border-0'
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}&layer=mapnik&marker=${currentPosition.lat}%2C${currentPosition.lng}`}
            />
            <div className='absolute top-5 right-5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-md text-xs font-medium text-gray-800 flex items-center gap-2 z-10 pointer-events-none'>
                <span className='w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping'></span>
                <span className='font-semibold'>Live GPS Map</span>
            </div>
        </div>
    );
}

export default LiveTracking