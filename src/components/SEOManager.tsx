import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const SEOManager = () => {
    useEffect(() => {
        const updateSEO = async () => {
            try {
                const { data, error } = await supabase
                    .from('site_settings')
                    .select('seo_title, seo_description, seo_keywords, favicon_mode, favicon_url, favicon_url_dark')
                    .single();

                if (error) throw error;
                if (data) {
                    // Update Title
                    if (data.seo_title) {
                        document.title = data.seo_title;
                    }

                    // Update Meta Description
                    let metaDesc = document.querySelector('meta[name="description"]');
                    if (!metaDesc) {
                        metaDesc = document.createElement('meta');
                        metaDesc.setAttribute('name', 'description');
                        document.head.appendChild(metaDesc);
                    }
                    if (data.seo_description) {
                        metaDesc.setAttribute('content', data.seo_description);
                    }

                    // Update Meta Keywords
                    let metaKeywords = document.querySelector('meta[name="keywords"]');
                    if (!metaKeywords) {
                        metaKeywords = document.createElement('meta');
                        metaKeywords.setAttribute('name', 'keywords');
                        document.head.appendChild(metaKeywords);
                    }
                    if (data.seo_keywords) {
                        metaKeywords.setAttribute('content', data.seo_keywords);
                    }

                    // Update Favicon
                    const faviconUrl = data.favicon_mode === 'dark' ? data.favicon_url_dark : data.favicon_url;
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
    }, []);

    return null;
};

export default SEOManager;
