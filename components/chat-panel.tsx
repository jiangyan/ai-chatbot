const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    // Convert to base64 first
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string' && reader.result.startsWith('data:image/')) {
          resolve(reader.result);
        } else {
          reject(new Error('Invalid image format'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // Create message content in the correct format
    const content = [
      {
        type: 'text',
        text: input || 'What can you tell me about this image?'
      },
      {
        type: 'image_url',
        image_url: {
          url: base64
        }
      }
    ];

    // Send the message
    const id = await append({
      id,
      content,
      role: 'user'
    });

    setInput('');
    setUserMessageId(id);
  } catch (error) {
    console.error('Error uploading image:', error);
  }
}; 