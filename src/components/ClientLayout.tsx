// src/components/ClientLayout.tsx
'use client';

import { useEffect } from 'react';

import { ModuleRegistry } from "ag-grid-community";
import { LicenseManager } from "ag-grid-enterprise";


LicenseManager.setLicenseKey("CompanyName=Kaar Technologies UK Limited,LicensedApplication=KTern,LicenseType=SingleApplication,LicensedConcurrentDeveloperCount=1,LicensedProductionInstancesCount=1,AssetReference=AG-029666,SupportServicesEnd=6_July_2023_[v2]_MTY4ODU5ODAwMDAwMA==0d9bb6bb92865cf2e4c720295923fd69");


export default function ClientLayout({ children }: { children: React.ReactNode }) {
    useEffect(() => {
    }, []);

    return <>{children}</>;
}