import { motion } from 'framer-motion';

interface PageLoadingProps {
    logoUrl?: string | null;
}

const PageLoading = ({ logoUrl }: PageLoadingProps) => {
    return (
        <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#05070A] overflow-hidden"
        >
            {/* Background elements for depth */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/10 rounded-full blur-[120px]" />
            </div>

            <div className="relative">
                {/* Tech Rings */}
                <div className="relative w-40 h-40 flex items-center justify-center">
                    {/* Ring 1 - Fast Outer */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 border-[1px] border-accent/20 rounded-full border-t-accent"
                    />

                    {/* Ring 2 - Slow Inner */}
                    <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-6 border-[1px] border-accent/10 rounded-full border-b-accent/40"
                    />

                    {/* Ring 3 - Dashed Orbit */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-10 border-[1px] border-dashed border-accent/20 rounded-full"
                    />

                    {/* Core Logo */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="relative z-10 w-24 h-24 flex items-center justify-center"
                    >
                        {logoUrl && (
                            <motion.img
                                key={logoUrl}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                                src={logoUrl}
                                alt="Loading"
                                className="w-20 h-20 object-contain filter drop-shadow-[0_0_15px_rgba(30,115,255,0.3)]"
                            />
                        )}
                    </motion.div>
                </div>

                {/* Progress Detail */}
                <div className="absolute top-full mt-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: 140 }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="h-[1px] bg-gradient-to-r from-transparent via-accent to-transparent"
                    />
                </div>
            </div>
        </motion.div>
    );
};

export default PageLoading;
