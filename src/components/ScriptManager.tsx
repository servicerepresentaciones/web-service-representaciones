import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface Script {
    content: string;
    location: string;
    display_location?: string;
}

const ScriptManager = () => {
    const location = useLocation();
    const [scripts, setScripts] = useState<Script[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // 1. Fetch scripts on mount
    useEffect(() => {
        let mounted = true;

        const loadScripts = async () => {
            try {
                // Fetch from new table
                const { data, error } = await supabase
                    .from('custom_scripts')
                    .select('content, location, display_location')
                    .eq('is_active', true);

                if (error) {
                    // Fallback logic for legacy/missing table
                    if (error.code === 'PGRST116' || error.message.includes('relation "public.custom_scripts" does not exist')) {
                        console.warn("custom_scripts table not found, attempting fallback to site_settings");
                        // Logic for fallback can be simpler or skipped to avoid complexity crashing the app
                        return; // Skip fallback for now to ensure stability, or implement carefully
                    }
                    console.error("Error fetching scripts:", error);
                    return;
                }

                if (mounted && data) {
                    setScripts(data);
                    setIsLoaded(true);
                }
            } catch (err) {
                console.error("Critical error loading scripts:", err);
            }
        };

        loadScripts();

        return () => { mounted = false; };
    }, []);

    // 2. Inject scripts when location or scripts change
    useEffect(() => {
        if (!isLoaded || !scripts.length) return;

        const inject = (content: string, loc: string, scope: 'global' | 'page') => {
            if (!content) return;
            try {
                // Sanitize attribute name part
                const safeLoc = loc.replace(/[^a-z0-9-_]/gi, '');
                const attrName = `data-script-injected-${safeLoc}-${scope}`;

                // Remove existing
                document.querySelectorAll(`[${attrName}]`).forEach(el => el.remove());

                // Create container to parse HTML string
                const container = document.createElement('div');
                container.innerHTML = content;

                // Append each node
                Array.from(container.childNodes).forEach(node => {
                    if (node.nodeType === 1) { // Element
                        const el = node as HTMLElement;
                        const newScript = document.createElement(el.tagName);

                        // Copy attributes
                        Array.from(el.attributes).forEach(attr => {
                            newScript.setAttribute(attr.name, attr.value);
                        });

                        // Set tracking attribute
                        newScript.setAttribute(attrName, 'true');

                        // Set content
                        if (el.tagName === 'SCRIPT') {
                            newScript.textContent = el.textContent; // Use textContent for scripts usually
                            // If script has src, it will load automatically when appended
                        } else {
                            newScript.innerHTML = el.innerHTML;
                        }

                        // Inject
                        if (loc === 'head') document.head.appendChild(newScript);
                        else if (loc === 'body_start') document.body.prepend(newScript);
                        else document.body.appendChild(newScript);
                    }
                });
            } catch (e) {
                console.error("Error injecting script chunk:", e);
            }
        };

        // Separate scripts
        const globalScripts = scripts.filter(s => !s.display_location || s.display_location === 'all_pages');

        // Determine page scripts based on current path
        const isThankYouPage = location.pathname === '/gracias';
        const pageScripts = scripts.filter(s => s.display_location === 'thank_you_page' && isThankYouPage);

        // Group by location
        const group = (list: Script[]) => list.reduce((acc, s) => {
            const l = s.location || 'head';
            acc[l] = (acc[l] || '') + '\n' + s.content;
            return acc;
        }, {} as Record<string, string>);

        const globalGrouped = group(globalScripts);
        const pageGrouped = group(pageScripts);

        // Inject Globals (idempotent due to removal of existing with same scope)
        Object.entries(globalGrouped).forEach(([loc, content]) => inject(content, loc, 'global'));

        // Inject Page Specifics
        // Always clean up page scope first for all potential locations
        ['head', 'body_start', 'body_end'].forEach(loc => {
            // Remove previous page-scoped scripts for this location
            const safeLoc = loc.replace(/[^a-z0-9-_]/gi, '');
            const attrName = `data-script-injected-${safeLoc}-page`;
            document.querySelectorAll(`[${attrName}]`).forEach(el => el.remove());

            // Inject new if exists
            if (pageGrouped[loc]) {
                inject(pageGrouped[loc], loc, 'page');
            }
        });

    }, [isLoaded, scripts, location.pathname]);

    return null;
};

export default ScriptManager;
