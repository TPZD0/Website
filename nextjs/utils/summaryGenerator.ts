import { ExtractedPDFContent } from './pdfUtils';

export interface GeneratedSummary {
  content: string;
  keyPoints: string[];
  wordCount: number;
}

export function generateSummaryFromContent(content: ExtractedPDFContent): GeneratedSummary {
  const { text, keyTerms } = content;
  
  // Split text into sentences
  const sentences = text.split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20);
  
  // Extract key sentences (containing important terms or being long enough)
  const keySentences = extractKeySentences(sentences, keyTerms);
  
  // Generate summary content
  const summaryContent = generateSummaryContent(keySentences, keyTerms);
  
  // Generate key points
  const keyPoints = generateKeyPoints(keySentences, keyTerms);
  
  // Calculate word count
  const wordCount = summaryContent.split(/\s+/).filter(word => word.length > 0).length;
  
  return {
    content: summaryContent,
    keyPoints,
    wordCount
  };
}

function extractKeySentences(sentences: string[], keyTerms: string[]): string[] {
  // Score sentences based on length, key terms, and position
  const scoredSentences = sentences.map((sentence, index) => {
    let score = 0;
    
    // Length score (prefer moderate length sentences)
    if (sentence.length >= 50 && sentence.length <= 200) {
      score += 2;
    } else if (sentence.length >= 30) {
      score += 1;
    }
    
    // Key terms score
    keyTerms.forEach(term => {
      if (sentence.toLowerCase().includes(term.toLowerCase())) {
        score += 3;
      }
    });
    
    // Position score (earlier sentences often contain important info)
    if (index < sentences.length * 0.3) {
      score += 1;
    }
    
    // Avoid very short or very long sentences
    if (sentence.length < 20 || sentence.length > 300) {
      score -= 2;
    }
    
    return { sentence, score, index };
  });
  
  // Sort by score and take top sentences
  return scoredSentences
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(8, Math.ceil(sentences.length * 0.1)))
    .sort((a, b) => a.index - b.index) // Restore original order
    .map(item => item.sentence);
}

function generateSummaryContent(keySentences: string[], keyTerms: string[]): string {
  if (keySentences.length === 0) {
    return "This document contains information that can be summarized as follows: The content covers various topics and concepts that are relevant to the subject matter.";
  }
  
  // Create summary paragraphs
  const paragraphs: string[] = [];
  
  // Introduction paragraph
  if (keyTerms.length > 0) {
    const mainTerms = keyTerms.slice(0, 3).join(', ');
    paragraphs.push(`This document discusses key concepts including ${mainTerms}, providing detailed information on these important topics.`);
  }
  
  // Main content paragraphs (group sentences logically)
  const midPoint = Math.ceil(keySentences.length / 2);
  const firstHalf = keySentences.slice(0, midPoint);
  const secondHalf = keySentences.slice(midPoint);
  
  if (firstHalf.length > 0) {
    paragraphs.push(firstHalf.join(' '));
  }
  
  if (secondHalf.length > 0) {
    paragraphs.push(secondHalf.join(' '));
  }
  
  // Conclusion paragraph
  if (keyTerms.length > 0) {
    paragraphs.push(`In summary, the document provides comprehensive coverage of ${keyTerms[0]} and related concepts, offering valuable insights into the subject matter.`);
  }
  
  return paragraphs.join('\n\n');
}

function generateKeyPoints(keySentences: string[], keyTerms: string[]): string[] {
  const points: string[] = [];
  
  // Extract key points from key terms
  keyTerms.slice(0, 5).forEach(term => {
    const relatedSentence = keySentences.find(s => 
      s.toLowerCase().includes(term.toLowerCase())
    );
    
    if (relatedSentence) {
      // Extract a concise point about this term
      const words = relatedSentence.split(/\s+/);
      const termIndex = words.findIndex(word => 
        word.toLowerCase().includes(term.toLowerCase())
      );
      
      if (termIndex !== -1) {
        const start = Math.max(0, termIndex - 5);
        const end = Math.min(words.length, termIndex + 10);
        const point = words.slice(start, end).join(' ');
        points.push(point.charAt(0).toUpperCase() + point.slice(1));
      }
    } else {
      // Create a generic point about the term
      points.push(`${term.charAt(0).toUpperCase() + term.slice(1)} is an important concept discussed in the document`);
    }
  });
  
  // Extract additional points from sentences
  const additionalSentences = keySentences.filter(sentence => {
    return !keyTerms.some(term => 
      sentence.toLowerCase().includes(term.toLowerCase())
    );
  }).slice(0, 3);
  
  additionalSentences.forEach(sentence => {
    // Create a shortened version of the sentence as a key point
    const words = sentence.split(/\s+/);
    if (words.length > 15) {
      const shortPoint = words.slice(0, 15).join(' ') + '...';
      points.push(shortPoint);
    } else {
      points.push(sentence);
    }
  });
  
  // Ensure we have at least a few key points
  if (points.length === 0) {
    points.push('The document contains important information relevant to the topic');
    points.push('Key concepts and ideas are presented throughout the text');
    points.push('The content provides valuable insights into the subject matter');
  }
  
  return points.slice(0, 6); // Limit to 6 key points
}