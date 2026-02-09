import { motion } from 'framer-motion';

interface PageLoadingProps {
    logoUrl?: string | null;
}

const PageLoading = ({ logoUrl }: PageLoadingProps) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{
                opacity: 0,
                transition: { duration: 0.4 }
            }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0A111A] overflow-hidden"
        >
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 opacity-[0.05]"
                style={{ backgroundImage: 'radial-gradient(circle, #1E73FF 1px, transparent 1px)', backgroundSize: '32px 32px' }}
            />

            {/* Background elements for depth */}
            <div className="absolute inset-0 overflow-hidden">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.15, 0.25, 0.15]
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/20 rounded-full blur-[140px]"
                />
            </div>

            {/* Scanned Line Effect */}
            <motion.div
                animate={{ y: ['-100%', '100%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 w-full h-1/2 bg-gradient-to-b from-transparent via-accent/[0.05] to-transparent pointer-events-none"
            />

            <div className="relative">
                {/* Tech Rings Container */}
                <div className="relative w-48 h-48 flex items-center justify-center">

                    {/* Ring 1 - Fast Outer (Glow) */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 border-[1px] border-accent/20 rounded-full border-t-accent shadow-[0_0_15px_rgba(30,115,255,0.2)]"
                    />

                    {/* Ring 2 - Multi-Segment Middle */}
                    <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-4 border-[1px] border-accent/10 rounded-full border-r-accent/40 border-l-accent/40"
                    />

                    {/* Ring 3 - Dashed Orbit */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-10 border-[1.5px] border-dashed border-accent/20 rounded-full"
                    />

                    {/* Ring 4 - Inner Pulse */}
                    <motion.div
                        animate={{
                            scale: [0.95, 1.05, 0.95],
                            opacity: [0.3, 0.6, 0.3]
                        }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-14 border border-accent/30 rounded-full"
                    />

                    {/* Core Logo Container */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="relative z-10 w-28 h-28 flex items-center justify-center"
                    >
                        {logoUrl ? (
                            <motion.img
                                key={logoUrl}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.4 }}
                                src={logoUrl}
                                alt="Loading"
                                className="w-20 h-20 object-contain filter drop-shadow-[0_0_20px_rgba(30,115,255,0.4)]"
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-lg bg-accent/10 animate-pulse" />
                        )}
                    </motion.div>
                </div>

                {/* Progress Detail */}
                <div className="absolute top-full mt-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 w-64">
                    <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden relative">
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: '100%' }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-accent to-transparent"
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default PageLoading;
