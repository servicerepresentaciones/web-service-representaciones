import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

const SEOManager = () => {
    const location = useLocation();

    useEffect(() => {
        const updateSEO = async () => {
            try {
                // Determine current path (simplifying nested paths if needed)
                let currentPath = location.pathname;

                // For dynamic routes like /servicios/1 or /productos/1, we might want a generic SEO or handle individually.
                // For now, let's try to find an exact match or a parent match.

                // Fetch Global Settings (Favicon & Fallback SEO)
                // Fetch Per-Page SEO (Specific path)
                const [globalRes, pageRes] = await Promise.all([
                    supabase.from('site_settings').select('seo_title, seo_description, seo_keywords, favicon_mode, favicon_url, favicon_url_dark').single(),
                    supabase.from('page_seo').select('title, description, keywords').eq('page_path', currentPath).maybeSingle()
                ]);

                if (globalRes.error) throw globalRes.error;

                const globalData = globalRes.data;
                const pageData = pageRes.data;

                if (globalData) {
                    // Update Title: Prefer page specific, then global
                    const finalTitle = pageData?.title || globalData.seo_title;
                    if (finalTitle) {
                        document.title = finalTitle;
                    }

                    // Update Meta Description
                    let metaDesc = document.querySelector('meta[name="description"]');
                    if (!metaDesc) {
                        metaDesc = document.createElement('meta');
                        metaDesc.setAttribute('name', 'description');
                        document.head.appendChild(metaDesc);
                    }
                    const finalDesc = pageData?.description || globalData.seo_description;
                    if (finalDesc) {
                        metaDesc.setAttribute('content', finalDesc);
                    }

                    // Update Meta Keywords
                    let metaKeywords = document.querySelector('meta[name="keywords"]');
                    if (!metaKeywords) {
                        metaKeywords = document.createElement('meta');
                        metaKeywords.setAttribute('name', 'keywords');
                        document.head.appendChild(metaKeywords);
                    }
                    const finalKeywords = pageData?.keywords || globalData.seo_keywords;
                    if (finalKeywords) {
                        metaKeywords.setAttribute('content', finalKeywords);
                    }

                    // Update Favicon (Always Global)
                    const faviconUrl = globalData.favicon_mode === 'dark' ? globalData.favicon_url_dark : globalData.favicon_url;
                    if (faviconUrl) {
                        let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
                        if (!link) {
                            link = document.createElement('link');
                            link.rel = 'icon';
                            document.head.appendChild(link);
                        }
                        link.href = faviconUrl;
                    }
                }
            } catch (err) {
                console.error('Error updating SEO tags:', err);
            } finally {
                // Emit event that SEO is ready
                window.dispatchEvent(new CustomEvent('seo-ready'));
            }
        };

        updateSEO();
    }, [location.pathname]); // Update every time path changes

    return null;
};

export default SEOManager;
