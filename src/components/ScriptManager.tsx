import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const ScriptManager = () => {
    useEffect(() => {
        const loadScripts = async () => {
            try {
                // Obtenemos todos los scripts activos de la nueva tabla modular
                const { data: scripts, error } = await supabase
                    .from('custom_scripts')
                    .select('content, location')
                    .eq('is_active', true);

                if (error) {
                    // Si la tabla no existe aún, intentamos el fallback a site_settings (retrocompatibilidad temporal)
                    if (error.code === 'PGRST116' || error.message.includes('relation "public.custom_scripts" does not exist')) {
                        const { data: globalScripts } = await supabase
                            .from('site_settings')
                            .select('header_scripts, body_scripts, footer_scripts')
                            .single();

                        if (globalScripts) {
                            if (globalScripts.header_scripts) injectScripts(globalScripts.header_scripts, 'head');
                            if (globalScripts.body_scripts) injectScripts(globalScripts.body_scripts, 'body_start');
                            if (globalScripts.footer_scripts) injectScripts(globalScripts.footer_scripts, 'body_end');
                        }
                        return;
                    }
                    throw error;
                }

                if (!scripts || scripts.length === 0) return;

                // Agrupar scripts por ubicación
                const grouped = scripts.reduce((acc, script) => {
                    if (!acc[script.location]) acc[script.location] = '';
                    acc[script.location] += '\n' + script.content;
                    return acc;
                }, {} as Record<string, string>);

                // Inyectar por grupos
                Object.entries(grouped).forEach(([location, content]) => {
                    injectScripts(content, location);
                });

            } catch (err) {
                console.error('Error loading custom scripts:', err);
            }
        };

        /**
         * Inyecta un bloque de HTML/Scripts en una ubicación específica del DOM
         */
        const injectScripts = (content: string, location: string) => {
            if (!content) return;

            // Limpiar previos para evitar duplicados en SPA
            const typeAttr = `data-script-loc-${location}`;
            document.querySelectorAll(`[${typeAttr}]`).forEach(el => el.remove());

            const div = document.createElement('div');
            div.innerHTML = content.trim();

            Array.from(div.childNodes).forEach(node => {
                if (node.nodeType === 1) { // ELEMENT_NODE
                    const el = node as HTMLElement;
                    const newEl = document.createElement(el.tagName);

                    // Copiar todos los atributos
                    Array.from(el.attributes).forEach(attr => newEl.setAttribute(attr.name, attr.value));

                    // Marcar el elemento para limpieza posterior
                    newEl.setAttribute(typeAttr, 'true');

                    // Si es un script, copiar el contenido interno
                    if (el.tagName === 'SCRIPT') {
                        if (el.innerHTML) newEl.innerHTML = el.innerHTML;
                    } else {
                        newEl.innerHTML = el.innerHTML;
                    }

                    // Insertar en la ubicación correcta
                    if (location === 'head') {
                        document.head.appendChild(newEl);
                    } else if (location === 'body_start') {
                        document.body.prepend(newEl);
                    } else {
                        document.body.appendChild(newEl);
                    }
                }
            });
        };

        loadScripts();
    }, []);

    return null;
};

export default ScriptManager;
