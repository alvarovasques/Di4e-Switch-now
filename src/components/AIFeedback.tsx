import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare, Check } from 'lucide-react';

interface AIFeedbackProps {
  messageId: string;
  onSubmitFeedback: (messageId: string, score: number, comment?: string) => void;
}

const AIFeedback: React.FC<AIFeedbackProps> = ({ messageId, onSubmitFeedback }) => {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackScore, setFeedbackScore] = useState<number | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  
  const handleFeedbackClick = (score: number) => {
    setFeedbackScore(score);
    setShowFeedbackForm(true);
  };
  
  const handleSubmitFeedback = () => {
    if (feedbackScore !== null) {
      onSubmitFeedback(messageId, feedbackScore, feedbackComment);
      setSubmitted(true);
      setShowFeedbackForm(false);
    }
  };
  
  if (submitted) {
    return (
      <span className="text-xs text-green-500 flex items-center gap-1">
        <Check className="w-3 h-3" />
        Feedback enviado
      </span>
    );
  }
  
  return (
    <div className="relative">
      {!showFeedbackForm ? (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleFeedbackClick(5)}
            className="text-gray-400 hover:text-green-500 transition-colors"
            title="Resposta útil"
          >
            <ThumbsUp className="w-3 h-3" />
          </button>
          <button
            onClick={() => handleFeedbackClick(1)}
            className="text-gray-400 hover:text-red-500 transition-colors"
            title="Resposta não útil"
          >
            <ThumbsDown className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div className="absolute bottom-0 right-0 mb-6 bg-white border rounded-lg shadow-lg p-3 w-64 z-10">
          <h4 className="font-medium text-sm mb-2">
            {feedbackScore && feedbackScore > 3 
              ? 'O que você gostou na resposta?' 
              : 'Por que a resposta não foi útil?'}
          </h4>
          
          <textarea
            value={feedbackComment}
            onChange={(e) => setFeedbackComment(e.target.value)}
            placeholder="Seu feedback (opcional)"
            className="w-full border rounded p-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-primary"
            rows={3}
          />
          
          <div className="flex justify-between">
            <button
              onClick={() => setShowFeedbackForm(false)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmitFeedback}
              className="text-xs bg-primary text-white px-3 py-1 rounded hover:bg-primary-dark"
            >
              Enviar feedback
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIFeedback;