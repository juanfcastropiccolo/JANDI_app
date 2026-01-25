/*
 * VERSIÓN SIMPLE DE TEXTTYPE PARA DEBUGGING
 */
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

interface TextTypeProps {
  text: string | string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  initialDelay?: number;
  loop?: boolean;
  showCursor?: boolean;
  cursorCharacter?: string;
  cursorBlinkDuration?: number;
  className?: string;
}

const TextType = ({
  text,
  typingSpeed = 75,
  deletingSpeed = 50,
  pauseDuration = 5000,
  initialDelay = 500,
  loop = true,
  showCursor = true,
  cursorCharacter = '_',
  cursorBlinkDuration = 0.5,
  className = '',
}: TextTypeProps) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const cursorRef = useRef<HTMLSpanElement>(null);

  const textArray = Array.isArray(text) ? text : [text];

  // Animación del cursor con GSAP
  useEffect(() => {
    if (showCursor && cursorRef.current) {
      gsap.to(cursorRef.current, {
        opacity: 0,
        duration: cursorBlinkDuration,
        repeat: -1,
        yoyo: true,
        ease: 'power2.inOut'
      });
    }
  }, [showCursor, cursorBlinkDuration]);

  // Lógica de typing
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const currentText = textArray[currentTextIndex];

    if (currentCharIndex === 0 && !isDeleting && displayedText === '') {
      // Delay inicial
      timeout = setTimeout(() => {
        setDisplayedText(currentText[0]);
        setCurrentCharIndex(1);
      }, initialDelay);
    } else if (!isDeleting) {
      // Escribiendo
      if (currentCharIndex < currentText.length) {
        timeout = setTimeout(() => {
          setDisplayedText(prev => prev + currentText[currentCharIndex]);
          setCurrentCharIndex(prev => prev + 1);
        }, typingSpeed);
      } else {
        // Terminó de escribir, esperar antes de borrar
        timeout = setTimeout(() => {
          setIsDeleting(true);
        }, pauseDuration);
      }
    } else {
      // Borrando
      if (displayedText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayedText(prev => prev.slice(0, -1));
        }, deletingSpeed);
      } else {
        // Terminó de borrar, siguiente texto
        setIsDeleting(false);
        setCurrentCharIndex(0);
        if (loop || currentTextIndex < textArray.length - 1) {
          setCurrentTextIndex((prev) => (prev + 1) % textArray.length);
        }
      }
    }

    return () => clearTimeout(timeout);
  }, [currentCharIndex, displayedText, isDeleting, currentTextIndex, textArray, typingSpeed, deletingSpeed, pauseDuration, initialDelay, loop]);

  console.log('TextType render:', { displayedText, currentCharIndex, isDeleting, currentTextIndex });

  return (
    <span className={`inline-block ${className}`}>
      <span className="inline">{displayedText}</span>
      {showCursor && (
        <span
          ref={cursorRef}
          className="ml-1 inline-block opacity-100"
        >
          {cursorCharacter}
        </span>
      )}
    </span>
  );
};

export default TextType;
