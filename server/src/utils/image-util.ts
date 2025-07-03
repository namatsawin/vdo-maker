export async function convertImageUrlToBase64(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer.toString('base64');
  } catch (error) {
    throw new Error(`Failed to convert image to base64: ${error}`);
  }
}

export default { convertImageUrlToBase64 }
