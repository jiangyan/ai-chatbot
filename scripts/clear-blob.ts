import { config } from 'dotenv';
import { del, list } from '@vercel/blob';

config({
  path: '.env.local',
});

const clearBlob = async () => {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not defined');
  }

  console.log('⏳ Clearing blob storage...');

  const start = Date.now();
  
  try {
    // List all blobs
    const { blobs } = await list();
    
    // Delete each blob
    for (const blob of blobs) {
      await del(blob.url);
      console.log(`Deleted: ${blob.pathname}`);
    }
    
    const end = Date.now();
    console.log('✅ Blob storage cleared in', end - start, 'ms');
  } catch (error) {
    console.error('❌ Failed to clear blob storage:', error);
  }
  
  process.exit(0);
};

clearBlob().catch((err) => {
  console.error('❌ Failed to clear blob storage');
  console.error(err);
  process.exit(1);
});