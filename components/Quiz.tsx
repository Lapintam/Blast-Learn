'use client';

import { FormEvent, useEffect, useState, useTransition } from "react";
import { Button } from "./ui/button";
import { Loader2Icon } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { askQuestion } from "@/actions/askQuestion";
import { useToast } from "./ui/use-toast";

type QuizQuestion = {
    question: string;
    options: { A: string; B: string; C: string; D: string };
    correctAnswer: string;
    explanation: string; // Add this new field
};

function Quiz({id}: {id: string}) {
    const { user } = useUser();
    const { toast } = useToast();

    const [isPending, startTransition] = useTransition();
    const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
    const [userAnswer, setUserAnswer] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [questionNumber, setQuestionNumber] = useState(1); // New state for question number

    useEffect(() => {
        generateQuestion();
    }, []);

    const generateQuestion = async () => {
        setError(null);
        startTransition(async () => {
            try {
                const response = await askQuestion(id, "Generate a multiple-choice question with an explanation");
                if (response.success && response.quizQuestion) {
                    setCurrentQuestion(response.quizQuestion);
                    setUserAnswer(null);
                    setIsCorrect(null);
                    setQuestionNumber(prev => prev + 1); // Increment question number
                } else {
                    setError(response.message || "Failed to generate question");
                }
            } catch (err) {
                console.error("Error generating question:", err);
                setError("An error occurred while generating the question");
            }
        });
    };

    const handleAnswer = (answer: string) => {
        setUserAnswer(answer);
        setIsCorrect(answer === currentQuestion?.correctAnswer);
    };

    const handleNextQuestion = () => {
        generateQuestion();
    };

    if (isPending) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2Icon className="animate-spin h-20 w-20 text-[#6092C6]"/>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <p className="text-red-500 mb-4">{error}</p>
                <Button onClick={generateQuestion}>Try Again</Button>
            </div>
        );
    }

    if (!currentQuestion) {
        return (
            <div className="flex items-center justify-center h-full">
                <p>No question available. Please try again.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full p-5 justify-between">
            <div>
                <h1 className="text-4xl text-center font-bold text-[#6092c6] mb-4">Question # {questionNumber - 1}</h1>
                <h2 className="text-2xl font-bold text-black mb-8">{currentQuestion.question}</h2>
                <div className="space-y-6"> {/* Increased spacing between options */}
                    {Object.entries(currentQuestion.options).map(([key, value]) => (
                        <Button
                            key={key}
                            onClick={() => handleAnswer(key)}
                            className={`w-full h-auto rounded-full min-h-[80px] text-white text-xl justify-start items-start p-6 whitespace-normal ${
                                userAnswer === key
                                    ? userAnswer === currentQuestion.correctAnswer
                                        ? "bg-green-500"
                                        : "bg-red-500"
                                    : "bg-[#6092C6]"
                            }`}
                            disabled={userAnswer !== null}
                        >
                            <span className="mr-2">{key}:</span>
                            <span className="text-left">{value}</span>
                        </Button>
                    ))}
                </div>
            </div>
            {userAnswer !== null && (
                <div className="mt-8">
                    <p className={`text-4xl ${isCorrect ? "text-green-500" : "text-red-500"}`}>
                        {isCorrect ? "Correct!" : `Incorrect. The correct answer was ${currentQuestion.correctAnswer}`}
                    </p>
                    <p className="mt-4 text-xl text-black">
                        {currentQuestion.explanation}
                    </p>
                    <Button onClick={handleNextQuestion} className="mt-6 rounded-full text-white bg-[#6092C6] text-2xl py-4 px-8">
                        Next Question
                    </Button>
                </div>
            )}
        </div>
    );
}

export default Quiz;