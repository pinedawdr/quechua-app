// src/services/cloudinary.js
import axios from 'axios';

const CLOUD_NAME = 'dwsht1d0o';
const API_KEY = '229868652573285';
const UPLOAD_PRESET = 'quechua_app_preset';

export const uploadImage = async (imageUri) => {
  try {
    const formData = new FormData();
    
    // Verificar si es un objeto File (web) o URI (móvil)
    if (typeof imageUri === 'string') {
      // Para móvil: crear un objeto file a partir del URI
      const filename = imageUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image';
      
      formData.append('file', { uri: imageUri, name: filename, type });
    } else {
      // Para web: usar directamente el objeto File
      formData.append('file', imageUri);
    }
    
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('api_key', API_KEY);
    
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return response.data.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

export const uploadAudio = async (audioFile) => {
  try {
    const formData = new FormData();
    
    // Verificar si es un objeto File (web) o URI (móvil)
    if (typeof audioFile === 'string') {
      // Para móvil: crear un objeto file a partir del URI
      const filename = audioFile.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `audio/${match[1]}` : 'audio/mpeg';
      
      formData.append('file', { uri: audioFile, name: filename, type });
    } else {
      // Para web: usar directamente el objeto File
      formData.append('file', audioFile);
    }
    
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('api_key', API_KEY);
    formData.append('resource_type', 'video'); // Cloudinary usa 'video' para archivos de audio también
    
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return response.data.secure_url;
  } catch (error) {
    console.error('Error uploading audio to Cloudinary:', error);
    throw error;
  }
};

export const getImageUrl = (publicId) => {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${publicId}`;
};

export const getAudioUrl = (publicId) => {
  return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/${publicId}`;
};