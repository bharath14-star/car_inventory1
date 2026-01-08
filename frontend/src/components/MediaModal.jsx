import React, { useState, useEffect } from 'react';
import './MediaModal.css';

const MediaModal = ({ isOpen, onClose, mediaUrls, initialIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  if (!isOpen || !mediaUrls || mediaUrls.length === 0) return null;

  const currentMedia = mediaUrls[currentIndex];
  const isVideo = currentMedia && (currentMedia.endsWith('.mp4') || currentMedia.endsWith('.webm') || currentMedia.endsWith('.ogg'));

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : mediaUrls.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < mediaUrls.length - 1 ? prev + 1 : 0));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') goToPrevious();
    if (e.key === 'ArrowRight') goToNext();
    if (e.key === 'Escape') onClose();
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <div className="media-modal-overlay" onClick={onClose}>
      <div className="media-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="media-modal-close" onClick={onClose}>&times;</button>

        <div className="media-modal-body">
          {isVideo ? (
            <video
              src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://car-inventory1-1.onrender.com'}${currentMedia}`}
              controls
              autoPlay
              className="media-modal-video"
            />
          ) : (
            <img
              src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://car-inventory1-1.onrender.com'}${currentMedia}`}
              alt="Media"
              className="media-modal-image"
            />
          )}
        </div>

        {mediaUrls.length > 1 && (
          <>
            <button className="media-modal-nav media-modal-prev" onClick={goToPrevious}>
              &#10094;
            </button>
            <button className="media-modal-nav media-modal-next" onClick={goToNext}>
              &#10095;
            </button>
          </>
        )}

        <div className="media-modal-indicators">
          {mediaUrls.map((_, index) => (
            <span
              key={index}
              className={`indicator ${index === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(index)}
            ></span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MediaModal;
