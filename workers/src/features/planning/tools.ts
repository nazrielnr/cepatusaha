/**
 * Planning Mode Tool Schemas
 * 
 * Defines tools for planning mode that generate interactive requirement gathering,
 * planning documents (PRD, Sitemap, Design Brief, SEO), and execution.
 */

import type { ToolSchema } from '../files/tools';

/**
 * Planning Mode Tool Schemas
 */
export const PLANNING_TOOL_SCHEMAS: ToolSchema[] = [
  {
    name: 'gather_requirements',
    description: `Menampilkan form interaktif untuk mengumpulkan kebutuhan website dari user.

GUNAKAN tool ini sebagai langkah PERTAMA saat user dalam planning mode.
Setelah user submit jawaban, panggil generate_planning_docs() dengan data yang dikumpulkan.

Output akan dirender sebagai form interaktif di frontend dengan:
- Template selection (pilihan jenis website)
- Dynamic questions berdasarkan kategori bisnis
- Multiple choice dan single choice options`,
    parameters: {
      type: 'object',
      properties: {
        business_category: {
          type: 'string',
          description: 'Kategori bisnis yang terdeteksi dari prompt user',
          enum: ['retail', 'fnb', 'jasa', 'kesehatan', 'edukasi', 'kreatif', 'properti', 'teknologi', 'other'],
        },
        business_name: {
          type: 'string',
          description: 'Nama bisnis yang terdeteksi dari prompt user (jika ada)',
        },
        suggested_templates: {
          type: 'array',
          description: 'Template website yang disarankan berdasarkan kategori bisnis',
          items: { type: 'string' },
        },
        questions: {
          type: 'array',
          description: 'Pertanyaan relevan yang perlu dijawab user (max 5-7 pertanyaan)',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Unique ID untuk question' },
              question: { type: 'string', description: 'Teks pertanyaan' },
              type: { 
                type: 'string', 
                enum: ['single_choice', 'multiple_choice', 'text'],
                description: 'Tipe input: single_choice, multiple_choice, atau text'
              },
              options: { 
                type: 'array', 
                items: { type: 'string' },
                description: 'Pilihan jawaban (untuk single_choice dan multiple_choice)'
              },
              required: { 
                type: 'boolean', 
                description: 'Apakah pertanyaan wajib dijawab'
              }
            },
            required: ['id', 'question', 'type']
          }
        }
      },
      required: ['business_category', 'suggested_templates', 'questions']
    }
  },
  {
    name: 'generate_planning_docs',
    description: `Generate structured website planning docs after the user answers gather_requirements.

Use this tool for planning docs; do not create PRD/Sitemap/Design/SEO files manually.
Output is structured data for the preview panel.

Must include:
- PRD
- Sitemap
- Design brief
- SEO plan`, 
    parameters: {
      type: 'object',
      properties: {
        business_info: {
          type: 'object',
          description: 'Informasi bisnis dari user',
          properties: {
            name: { type: 'string', description: 'Nama bisnis' },
            category: { type: 'string', description: 'Kategori bisnis' },
            tagline: { type: 'string', description: 'Tagline bisnis (opsional)' },
            target_audience: { 
              type: 'array', 
              items: { type: 'string' },
              description: 'Target audience bisnis'
            }
          },
          required: ['name', 'category']
        },
        selected_template: {
          type: 'string',
          description: 'Template yang dipilih user (e.g., "e-commerce", "landing-page", "portfolio")'
        },
        selected_features: {
          type: 'array',
          items: { type: 'string' },
          description: 'Fitur-fitur yang dipilih user'
        },
        prd: {
          type: 'object',
          description: 'Product Requirements Document',
          properties: {
            executive_summary: { type: 'string', description: 'Ringkasan eksekutif 2-3 kalimat' },
            goals: { 
              type: 'array', 
              items: { type: 'string' },
              description: 'Goals/tujuan website (3-5 goals)'
            },
            features: {
              type: 'array',
              description: 'Daftar fitur dengan prioritas',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  priority: { type: 'string', enum: ['must_have', 'nice_to_have'] }
                }
              }
            },
            user_stories: {
              type: 'array',
              items: { type: 'string' },
              description: 'User stories dalam format "Sebagai X, saya ingin Y, agar Z"'
            }
          },
          required: ['executive_summary', 'goals', 'features']
        },
        sitemap: {
          type: 'object',
          description: 'Struktur halaman website',
          properties: {
            pages: {
              type: 'array',
              description: 'Daftar halaman website',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', description: 'Nama halaman (e.g., "Home", "Produk")' },
                  path: { type: 'string', description: 'URL path (e.g., "/", "/produk")' },
                  sections: { 
                    type: 'array', 
                    items: { type: 'string' },
                    description: 'Section-section dalam halaman'
                  },
                  sub_pages: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Sub-halaman jika ada'
                  }
                },
                required: ['name', 'path', 'sections']
              }
            }
          },
          required: ['pages']
        },
        design_brief: {
          type: 'object',
          description: 'Panduan desain visual',
          properties: {
            mood: { type: 'string', description: 'Mood/nuansa desain (e.g., "Professional", "Playful", "Elegant")' },
            color_palette: {
              type: 'array',
              description: 'Palet warna yang direkomendasikan',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', description: 'Nama warna (e.g., "Primary", "Accent")' },
                  hex: { type: 'string', description: 'Kode hex warna (#RRGGBB)' },
                  usage: { type: 'string', description: 'Penggunaan warna (e.g., "Background utama")' }
                }
              }
            },
            typography: {
              type: 'object',
              description: 'Rekomendasi typography',
              properties: {
                heading_font: { type: 'string', description: 'Font untuk heading (Google Fonts)' },
                body_font: { type: 'string', description: 'Font untuk body text (Google Fonts)' }
              }
            },
            inspiration_keywords: {
              type: 'array',
              items: { type: 'string' },
              description: 'Keywords untuk inspirasi desain'
            }
          },
          required: ['mood', 'color_palette', 'typography']
        },
        seo_plan: {
          type: 'object',
          description: 'SEO Planning untuk website bisnis',
          properties: {
            primary_keywords: {
              type: 'array',
              items: { type: 'string' },
              description: 'Keyword utama untuk ranking (2-5 keywords)'
            },
            secondary_keywords: {
              type: 'array',
              items: { type: 'string' },
              description: 'Long-tail keywords tambahan'
            },
            meta_title_template: {
              type: 'string',
              description: 'Template untuk meta title, e.g., "{Page} | {BusinessName} - {Tagline}"'
            },
            meta_description_template: {
              type: 'string',
              description: 'Template untuk meta description'
            },
            page_seo: {
              type: 'array',
              description: 'SEO spesifik per halaman',
              items: {
                type: 'object',
                properties: {
                  page: { type: 'string', description: 'Nama halaman' },
                  title: { type: 'string', description: 'Meta title untuk halaman' },
                  description: { type: 'string', description: 'Meta description untuk halaman' },
                  h1: { type: 'string', description: 'H1 heading untuk halaman' },
                  target_keywords: { 
                    type: 'array', 
                    items: { type: 'string' },
                    description: 'Target keywords untuk halaman ini'
                  }
                }
              }
            },
            local_seo: {
              type: 'object',
              description: 'Local SEO untuk bisnis lokal (opsional)',
              properties: {
                business_name: { type: 'string' },
                address: { type: 'string' },
                city: { type: 'string' },
                phone: { type: 'string' },
                business_hours: { type: 'string' },
                google_maps_embed: { type: 'boolean', description: 'Apakah perlu embed Google Maps' }
              }
            },
            structured_data: {
              type: 'object',
              description: 'Schema.org structured data settings',
              properties: {
                type: { 
                  type: 'string', 
                  enum: ['LocalBusiness', 'Organization', 'Product', 'Service'],
                  description: 'Tipe Schema.org'
                },
                include_breadcrumbs: { type: 'boolean', description: 'Include breadcrumb schema' },
                include_faq: { type: 'boolean', description: 'Include FAQ schema jika ada FAQ section' }
              }
            }
          },
          required: ['primary_keywords', 'meta_title_template', 'page_seo', 'structured_data']
        }
      },
      required: ['business_info', 'selected_template', 'prd', 'sitemap', 'design_brief', 'seo_plan']
    }
  },
  {
    name: 'execute_plan',
    description: `Execute approved planning data and transition to build mode.

Use only after user approves planning docs.
After this, the agent may use the standard file tools provided by the API.`, 
    parameters: {
      type: 'object',
      properties: {
        plan_data: {
          type: 'object',
          description: 'Data lengkap dari generate_planning_docs (akan digunakan sebagai context untuk generate kode)'
        },
        modifications: {
          type: 'object',
          description: 'Modifikasi yang user minta sebelum generate (opsional)',
          properties: {
            add_features: { 
              type: 'array', 
              items: { type: 'string' },
              description: 'Fitur tambahan yang diminta'
            },
            remove_features: { 
              type: 'array', 
              items: { type: 'string' },
              description: 'Fitur yang dihapus'
            },
            color_changes: {
              type: 'object',
              description: 'Perubahan warna yang diminta'
            },
            other_changes: {
              type: 'string',
              description: 'Perubahan lain dalam bentuk text'
            }
          }
        }
      },
      required: ['plan_data']
    }
  }
];

/**
 * Get all planning tool schemas
 */
export function getAllPlanningToolSchemas(): ToolSchema[] {
  return PLANNING_TOOL_SCHEMAS;
}

/**
 * Get planning tool schema by name
 */
export function getPlanningToolSchema(toolName: string): ToolSchema | undefined {
  return PLANNING_TOOL_SCHEMAS.find(s => s.name === toolName);
}

/**
 * Check if a tool is a planning tool
 */
export function isPlanningTool(toolName: string): boolean {
  return PLANNING_TOOL_SCHEMAS.some(s => s.name === toolName);
}
