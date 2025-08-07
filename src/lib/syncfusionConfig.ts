'use client'

// Syncfusion license configuration
export function initializeSyncfusion() {
  if (typeof window === 'undefined') return

  try {
    // Import Syncfusion license registration
    const { registerLicense } = require('@syncfusion/ej2-base')
    
    // Register license if available in environment variables
    const licenseKey = process.env.NEXT_PUBLIC_SYNCFUSION_LICENSE_KEY
    
    if (licenseKey) {
      registerLicense(licenseKey)
      console.log('✓ Syncfusion license registered successfully')
    } else {
      // For development/trial purposes, we'll continue without license
      console.warn('⚠ Syncfusion license key not found. Using trial version.')
      console.warn('📝 To remove trial watermark, add NEXT_PUBLIC_SYNCFUSION_LICENSE_KEY to your .env.local file')
      console.log('🔄 Continuing with trial version...')
    }
    
    // Test if Syncfusion is working
    console.log('🧪 Testing Syncfusion availability...')
    const { enableRipple } = require('@syncfusion/ej2-base')
    enableRipple(true)
    console.log('✅ Syncfusion base components are working')
    
  } catch (error) {
    console.error('❌ Failed to initialize Syncfusion:', error)
    throw error
  }
}

// Initialize on module load
if (typeof window !== 'undefined') {
  initializeSyncfusion()
}
