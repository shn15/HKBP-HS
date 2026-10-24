import React from 'react';
import AlkitabModal from './AlkitabModal';

interface AlkitabReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  onSelectVerse?: (verseText: string, referenceLabel: string) => void;
  onSelectVerseText?: (text: string) => void;
}

export default function AlkitabReaderModal({
  isOpen,
  onClose,
  initialQuery = '',
  onSelectVerse,
  onSelectVerseText
}: AlkitabReaderModalProps) {
  return (
    <AlkitabModal
      isOpen={isOpen}
      onClose={onClose}
      initialQuery={initialQuery}
      onSelectVerse={onSelectVerse}
      onSelectVerseText={onSelectVerseText}
    />
  );
}
