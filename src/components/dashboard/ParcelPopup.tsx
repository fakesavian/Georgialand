import React from 'react';
import { ParcelPreview } from '../../types/gis';

interface ParcelPopupProps {
  parcel: ParcelPreview;
}

export default function ParcelPopup({ parcel }: ParcelPopupProps) {
  return (
    <div className="space-y-2 text-xs text-olive-100">
      <h3 className="font-bold text-white">Parcel {parcel.parcelId}</h3>
      <p className="text-olive-400">{parcel.address || 'Address Needs verification'}, {parcel.county} County</p>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1">
        <dt className="text-olive-500">Owner</dt><dd>{parcel.ownerName || 'Locked / Needs verification'}</dd>
        <dt className="text-olive-500">Acreage</dt><dd>{parcel.acreage ?? 'N/A'}</dd>
        <dt className="text-olive-500">Zoning</dt><dd>{parcel.zoning || 'Needs verification'}</dd>
        <dt className="text-olive-500">Assessed</dt><dd>{parcel.assessedValue ? `$${parcel.assessedValue.toLocaleString()}` : 'N/A'}</dd>
      </dl>
      {parcel.sourceUrl && <a href={parcel.sourceUrl} target="_blank" rel="noreferrer" className="text-brand-400 underline">Open source</a>}
    </div>
  );
}
