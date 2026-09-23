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
          color: '#f97316', // Orange color for route
          width: 4,
        }),
        image: new Circle({
          radius: 8,
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

  // Update map when points change
  useEffect(() => {
    if (!vectorSourceRef.current || !mapInstanceRef.current) return;

    vectorSourceRef.current.clear();

    if (points.length === 0) {
      // No points, use center or default
      if (center) {
        mapInstanceRef.current.getView().setCenter(fromLonLat(center));
      }
      return;
    }

    // Draw route line
    if (points.length > 1) {
      const coordinates = points.map((p) => fromLonLat([p.lng, p.lat]));
      const lineFeature = new Feature({
        geometry: new LineString(coordinates),
      });
      vectorSourceRef.current.addFeature(lineFeature);

      // Fit map to show entire route
      const extent = lineFeature.getGeometry()?.getExtent();
      if (extent) {
        mapInstanceRef.current.getView().fit(extent, {
          padding: [50, 50, 50, 50],
          maxZoom: 16,
        });
      }
    }

    // Draw start marker (green)
    const startPoint = points[0];
    const startMarker = new Feature({
      geometry: new Point(fromLonLat([startPoint.lng, startPoint.lat])),
    });
    startMarker.setStyle(new Style({
      image: new Circle({
        radius: 8,
        fill: new Fill({ color: '#22c55e' }), // Green for start
        stroke: new Stroke({ color: '#fff', width: 2 }),
      }),
    }));
    vectorSourceRef.current.addFeature(startMarker);

    // Draw end marker (red) if more than one point
    if (points.length > 1) {
      const endPoint = points[points.length - 1];
      const endMarker = new Feature({
        geometry: new Point(fromLonLat([endPoint.lng, endPoint.lat])),
      });
      endMarker.setStyle(new Style({
        image: new Circle({
          radius: 8,
          fill: new Fill({ color: '#ef4444' }), // Red for end
          stroke: new Stroke({ color: '#fff', width: 2 }),
        }),
      }));
      vectorSourceRef.current.addFeature(endMarker);
    }
  }, [points, center]);

  return <div ref={mapRef} className="w-full h-full" />;
}
