'use client';

import { useEffect, useRef } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Feature } from 'ol';
import { Point, LineString } from 'ol/geom';
import { fromLonLat } from 'ol/proj';
import { Style, Circle, Fill, Stroke } from 'ol/style';
import 'ol/ol.css';
import { GPSPoint } from '@/lib/gps';

interface MapComponentProps {
  points: GPSPoint[];
  center?: [number, number];
}

// Default location: Jama Masjid, Delhi
const DEFAULT_CENTER: [number, number] = [77.2330, 28.6508];

export default function MapComponent({ points, center }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const vectorSourceRef = useRef<VectorSource | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize vector source for route
    const vectorSource = new VectorSource();
    vectorSourceRef.current = vectorSource;

    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: new Style({
        stroke: new Stroke({
          color: '#3b82f6',
          width: 4,
        }),
        image: new Circle({
          radius: 6,
          fill: new Fill({ color: '#ef4444' }),
          stroke: new Stroke({ color: '#fff', width: 2 }),
        }),
      }),
    });

    // Initialize map
    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        vectorLayer,
      ],
      view: new View({
        center: fromLonLat(center || DEFAULT_CENTER),
        zoom: 15,
      }),
    });

    mapInstanceRef.current = map;

    return () => {
      map.setTarget(undefined);
    };
  }, []);

  // Update map center when center prop changes
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.getView().setCenter(fromLonLat(center));
    }
  }, [center]);

  useEffect(() => {
    if (!vectorSourceRef.current || points.length === 0) return;

    vectorSourceRef.current.clear();

    // Draw route line
    if (points.length > 1) {
      const coordinates = points.map((p) => fromLonLat([p.lng, p.lat]));
      const lineFeature = new Feature({
        geometry: new LineString(coordinates),
      });
      vectorSourceRef.current.addFeature(lineFeature);
    }

    // Draw current position marker
    if (points.length > 0) {
      const lastPoint = points[points.length - 1];
      const markerFeature = new Feature({
        geometry: new Point(fromLonLat([lastPoint.lng, lastPoint.lat])),
      });
      vectorSourceRef.current.addFeature(markerFeature);

      // Center map on current position
      mapInstanceRef.current?.getView().setCenter(fromLonLat([lastPoint.lng, lastPoint.lat]));
    }
  }, [points]);

  return <div ref={mapRef} className="w-full h-full" />;
}
