import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    className?: string;
    placeholderClassName?: string;
}

const LazyImage = ({ src, alt, className, placeholderClassName, ...props }: LazyImageProps) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsInView(true);
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                rootMargin: '200px',
            }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => {
            if (containerRef.current) {
                observer.unobserve(containerRef.current);
            }
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className={cn("relative overflow-hidden bg-muted/20", className)}
        >
            {isInView && (
                <img
                    src={src}
                    alt={alt}
                    onLoad={() => setIsLoaded(true)}
                    className={cn(
                        "w-full h-full object-cover transition-opacity duration-500",
                        isLoaded ? "opacity-100" : "opacity-0",
                    )}
                    {...props}
                />
            )}
            {!isLoaded && (
                <div
                    className={cn(
                        "absolute inset-0 animate-pulse bg-muted/40",
                        placeholderClassName
                    )}
                />
            )}
        </div>
    );
};

export default LazyImage;
