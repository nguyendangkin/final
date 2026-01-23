import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

export interface ManagedImage {
  id: string;
  url: string;
  isNew: boolean;
  isThumbnail: boolean;
  uploading: boolean;
  error?: string;
}

export function useImageManager(initialImages: string[] = [], initialThumbnail: string = '') {
  const [images, setImages] = useState<ManagedImage[]>(() => {
    const album = initialImages.map((url, index) => ({
      id: `old-album-${index}`,
      url,
      isNew: false,
      isThumbnail: false,
      uploading: false,
    }));

    if (initialThumbnail) {
      return [
        {
          id: 'old-thumb',
          url: initialThumbnail,
          isNew: false,
          isThumbnail: true,
          uploading: false,
        },
        ...album,
      ];
    }
    return album;
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  const uploadFile = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`${apiUrl}/upload`, {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: formData,
      });
      if (!response.ok) throw new Error('Upload failed');
      const result = await response.json();
      return result.url;
    } catch (error) {
      console.error('Error uploading:', error);
      return null;
    }
  };

  const deleteTempFile = async (url: string) => {
    if (!url.includes('/temp/')) return;
    const filename = url.split('/temp/').pop();
    try {
      const token = localStorage.getItem('jwt_token');
      await fetch(`${apiUrl}/upload/${filename}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
    } catch (error) {
      console.error('Error deleting temp file:', error);
    }
  };

  const addImages = useCallback(async (files: File[]) => {
    const hasExistingThumbnail = images.some(img => img.isThumbnail);
    const newImages: ManagedImage[] = files.map((file, idx) => ({
      id: `new-${Date.now()}-${idx}`,
      url: URL.createObjectURL(file), // Local preview
      isNew: true,
      isThumbnail: !hasExistingThumbnail && idx === 0,
      uploading: true,
    }));

    setImages(prev => [...prev, ...newImages]);

    for (let i = 0; i < files.length; i++) {
      const url = await uploadFile(files[i]);
      setImages(prev => prev.map(img =>
        img.id === newImages[i].id
          ? { ...img, url: url || img.url, uploading: false, error: url ? undefined : 'Lỗi tải lên' }
          : img
      ));
    }
  }, [apiUrl]);

  const removeImage = useCallback(async (id: string) => {
    const imgToRemove = images.find(img => img.id === id);
    if (imgToRemove && imgToRemove.isNew && imgToRemove.url) {
      await deleteTempFile(imgToRemove.url);
    }
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      // If we removed the thumbnail, make the next image the thumbnail
      if (imgToRemove?.isThumbnail && filtered.length > 0) {
        filtered[0].isThumbnail = true;
      }
      return filtered;
    });
  }, [images]);

  const setThumbnail = useCallback((id: string) => {
    setImages(prev => prev.map(img => ({
      ...img,
      isThumbnail: img.id === id
    })));
  }, []);

  const reorderImages = useCallback((dragIndex: number, hoverIndex: number) => {
    setImages(prev => {
      const next = [...prev];
      const [draggedItem] = next.splice(dragIndex, 1);
      next.splice(hoverIndex, 0, draggedItem);
      return next;
    });
  }, []);

  const getFinalData = () => {
    const thumbnail = images.find(img => img.isThumbnail)?.url || '';
    const album = images.filter(img => !img.isThumbnail).map(img => img.url);
    return { thumbnail, images: album };
  };

  return {
    images,
    addImages,
    removeImage,
    setThumbnail,
    reorderImages,
    getFinalData,
    isUploading: images.some(img => img.uploading)
  };
}
