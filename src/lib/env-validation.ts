/**
 * Environment variable validation utility
 * This ensures required environment variables are present at application startup
 */

interface EnvConfig {
  WU_API_KEY: string;
  WU_STATION_ID: string;
}

function validateEnvVar(name: string): string {
  const value = process.env[name];
  
  if (!value || value.trim().length === 0) {
    throw new Error(
      `Missing required environment variable: ${name}\n` +
      `Please set ${name} in your environment or .env.local file.`
    );
  }
  
  return value.trim();
}

/**
 * Validates all required environment variables
 * Throws an error if any required variables are missing
 */
export function validateEnvironmentVariables(): EnvConfig {
  try {
    return {
      WU_API_KEY: validateEnvVar('WU_API_KEY'),
      WU_STATION_ID: validateEnvVar('WU_STATION_ID'),
    };
  } catch (error) {
    console.error('❌ Environment validation failed:');
    console.error(error instanceof Error ? error.message : String(error));
    console.error('\nRequired environment variables:');
    console.error('- WU_API_KEY: Weather Underground API key');
    console.error('- WU_STATION_ID: Weather station ID');
    console.error('\nCreate a .env.local file with these variables or set them in your deployment environment.');
    
    // Exit the process in server environments
    if (typeof window === 'undefined') {
      process.exit(1);
    }
    
    throw error;
  }
}

/**
 * Get validated environment variables
 * This should be called after validateEnvironmentVariables() has been run
 */
export function getEnvConfig(): EnvConfig {
  return {
    WU_API_KEY: process.env.WU_API_KEY!,
    WU_STATION_ID: process.env.WU_STATION_ID!,
  };
}
