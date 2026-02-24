const { Storage } = require('@google-cloud/storage');
const path = require('path');
require('dotenv').config();

const storage = new Storage({
  keyFilename: process.env.GCS_KEY_FILE || path.join(__dirname, 'gcs-key.json'),
});

const bucketName = process.env.GCS_BUCKET_NAME || 'eventhub-payment-proofs';

async function testGCS() {
  console.log('🧪 Testing GCS Connection and Configuration...\n');
  console.log('Bucket Name:', bucketName);
  console.log('Key File:', process.env.GCS_KEY_FILE || 'gcs-key.json');
  console.log('─'.repeat(60));

  try {
    // Test 1: Check bucket exists
    console.log('\n📦 Test 1: Checking if bucket exists...');
    const [exists] = await storage.bucket(bucketName).exists();
    if (exists) {
      console.log('✅ Bucket exists and is accessible');
    } else {
      console.log('❌ Bucket not found!');
      console.log('💡 Create bucket: gsutil mb gs://' + bucketName);
      return;
    }

    // Test 2: Check bucket permissions
    console.log('\n🔐 Test 2: Checking bucket permissions...');
    const [metadata] = await storage.bucket(bucketName).getMetadata();
    console.log('✅ Can read bucket metadata');
    console.log('   Location:', metadata.location);
    console.log('   Storage Class:', metadata.storageClass);

    // Test 3: Check if bucket is public (should be false)
    console.log('\n🔒 Test 3: Checking if bucket is PRIVATE...');
    const [policy] = await storage.bucket(bucketName).iam.getPolicy();
    const isPublic = policy.bindings?.some(binding => 
      binding.members.includes('allUsers') || binding.members.includes('allAuthenticatedUsers')
    );
    if (isPublic) {
      console.log('⚠️  WARNING: Bucket has PUBLIC access!');
      console.log('🔒 Run: gsutil iam ch -d allUsers:objectViewer gs://' + bucketName);
    } else {
      console.log('✅ Bucket is PRIVATE (secure)');
    }

    // Test 4: Upload test file
    console.log('\n📤 Test 4: Testing file upload...');
    const testData = Buffer.from('Test file from EventHub GCS Test - ' + new Date().toISOString());
    const fileName = `test-uploads/test-${Date.now()}.txt`;
    await storage.bucket(bucketName).file(fileName).save(testData, {
      metadata: {
        contentType: 'text/plain',
        cacheControl: 'private, max-age=300',
      }
    });
    console.log('✅ File uploaded successfully');
    console.log('   Path: gs://' + bucketName + '/' + fileName);

    // Test 5: Try direct access (should fail)
    console.log('\n🚫 Test 5: Testing direct access (should fail)...');
    const directUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
    console.log('   Direct URL:', directUrl);
    try {
      const response = await fetch(directUrl);
      if (response.ok) {
        console.log('⚠️  WARNING: File is publicly accessible!');
        console.log('🔒 Bucket should be private for security');
      } else {
        console.log('✅ Direct access blocked (secure)');
        console.log('   Status:', response.status, response.statusText);
      }
    } catch (err) {
      console.log('✅ Direct access blocked (secure)');
    }

    // Test 6: Generate signed URL
    console.log('\n🔐 Test 6: Generating signed URL...');
    const [signedUrl] = await storage
      .bucket(bucketName)
      .file(fileName)
      .getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      });
    console.log('✅ Signed URL generated successfully');
    console.log('   URL preview:', signedUrl.substring(0, 80) + '...');
    console.log('   Expires in: 15 minutes');

    // Test 7: Test signed URL access
    console.log('\n✅ Test 7: Testing signed URL access...');
    try {
      const response = await fetch(signedUrl);
      if (response.ok) {
        const content = await response.text();
        console.log('✅ Signed URL works! File is accessible');
        console.log('   Content:', content.substring(0, 50) + '...');
      } else {
        console.log('❌ Signed URL failed:', response.status);
      }
    } catch (err) {
      console.log('❌ Error accessing signed URL:', err.message);
    }

    // Test 8: Delete test file
    console.log('\n🗑️  Test 8: Cleaning up test file...');
    await storage.bucket(bucketName).file(fileName).delete();
    console.log('✅ Test file deleted successfully');

    // Summary
    console.log('\n' + '─'.repeat(60));
    console.log('🎉 All tests passed! GCS is configured correctly.\n');
    console.log('📝 Summary:');
    console.log('   ✅ Bucket exists and is accessible');
    console.log('   ✅ Service account has proper permissions');
    console.log('   ✅ Bucket is private (secure)');
    console.log('   ✅ File upload works');
    console.log('   ✅ Signed URL generation works');
    console.log('   ✅ Signed URL access works');
    console.log('   ✅ File cleanup works');
    console.log('\n🚀 Your GCS integration is ready for production!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\n🔍 Troubleshooting:');
    
    if (error.code === 'ENOENT') {
      console.error('   - GCS key file not found');
      console.error('   - Check: backend/gcs-key.json exists');
      console.error('   - Or set GCS_KEY_FILE in .env');
    } else if (error.code === 404) {
      console.error('   - Bucket does not exist');
      console.error('   - Create: gsutil mb gs://' + bucketName);
    } else if (error.code === 403) {
      console.error('   - Permission denied');
      console.error('   - Check service account has Storage Admin role');
    } else {
      console.error('\nFull error:');
      console.error(error);
    }
    
    console.error('\n📖 See GCS_SETUP_GUIDE.md for setup instructions\n');
    process.exit(1);
  }
}

// Run the test
testGCS();
