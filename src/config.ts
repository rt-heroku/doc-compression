/**
 * Configuration Management
 * Loads and manages plugin configuration from YAML files
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import YAML from 'yaml';
import { z } from 'zod';

/**
 * Configuration schema using Zod
 */
const ConfigSchema = z.object({
  compression: z.object({
    defaultStrategy: z.enum([
      'hierarchical-yaml',
      'dense-notation',
      'adjacency-lists',
      'table-compression',
      'tiered-structure',
      'hybrid'
    ]).default('hierarchical-yaml'),

    level: z.enum(['light', 'medium', 'aggressive']).default('medium'),

    input: z.object({
      include: z.array(z.string()).default(['**/*.md']),
      exclude: z.array(z.string()).default(['**/node_modules/**', '**/dist/**']),
      maxFileSizeMB: z.number().default(10)
    }).default({}),

    output: z.object({
      format: z.enum(['yaml', 'json']).default('yaml'),
      includeMetadata: z.boolean().default(true),
      generateReport: z.boolean().default(true),
      filenameTemplate: z.string().optional()
    }).default({}),

    validation: z.object({
      minCoverage: z.number().min(0).max(1).default(0.95),
      minFidelity: z.number().min(0).max(1).default(0.98),
      failOnLowQuality: z.boolean().default(false)
    }).default({}),

    strategies: z.object({
      hybrid: z.object({
        autoDetect: z.boolean().default(true),
        strategyWeights: z.record(z.number()).optional()
      }).optional(),

      denseNotation: z.object({
        maxSymbols: z.number().default(50),
        customSymbols: z.record(z.string()).optional()
      }).optional(),

      tieredStructure: z.object({
        tiers: z.number().min(2).max(5).default(3),
        tierWeights: z.array(z.number()).optional()
      }).optional()
    }).default({})
  })
});

export type Config = z.infer<typeof ConfigSchema>;

/**
 * Configuration Manager
 */
export class ConfigManager {
  private config: Config;
  private configPath?: string;

  constructor(projectPath?: string) {
    this.config = this.loadConfig(projectPath);
  }

  /**
   * Load configuration from file or use defaults
   */
  private loadConfig(projectPath?: string): Config {
    // 1. Get default configuration
    const defaultConfig = this.getDefaultConfig();

    // 2. If no project path, return defaults
    if (!projectPath) {
      return defaultConfig;
    }

    // 3. Try to load user config
    const possiblePaths = [
      join(projectPath, 'doc-compression.config.yaml'),
      join(projectPath, '.doc-compression.yaml'),
      join(projectPath, 'compression.config.yaml')
    ];

    for (const path of possiblePaths) {
      if (existsSync(path)) {
        try {
          const userConfig = this.loadConfigFile(path);
          const merged = this.mergeConfigs(defaultConfig, userConfig);
          this.configPath = path;
          console.log(`📝 Loaded config from: ${path}`);
          return merged;
        } catch (error) {
          console.warn(`⚠️  Failed to load config from ${path}:`, error);
        }
      }
    }

    // 4. Return defaults if no user config found
    return defaultConfig;
  }

  /**
   * Load config file and validate
   */
  private loadConfigFile(path: string): any {
    const content = readFileSync(path, 'utf-8');
    const parsed = YAML.parse(content);

    // Validate against schema
    const result = ConfigSchema.safeParse(parsed);

    if (!result.success) {
      throw new Error(`Invalid config: ${result.error.message}`);
    }

    return result.data;
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): Config {
    return {
      compression: {
        defaultStrategy: 'hierarchical-yaml',
        level: 'medium',
        input: {
          include: ['**/*.md', '**/*.markdown', '**/README*'],
          exclude: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
          maxFileSizeMB: 10
        },
        output: {
          format: 'yaml',
          includeMetadata: true,
          generateReport: true
        },
        validation: {
          minCoverage: 0.95,
          minFidelity: 0.98,
          failOnLowQuality: false
        },
        strategies: {}
      }
    };
  }

  /**
   * Merge default and user configs
   */
  private mergeConfigs(defaults: Config, user: any): Config {
    return {
      compression: {
        defaultStrategy: user.compression?.defaultStrategy || defaults.compression.defaultStrategy,
        level: user.compression?.level || defaults.compression.level,
        input: {
          include: user.compression?.input?.include || defaults.compression.input.include,
          exclude: user.compression?.input?.exclude || defaults.compression.input.exclude,
          maxFileSizeMB: user.compression?.input?.maxFileSizeMB || defaults.compression.input.maxFileSizeMB
        },
        output: {
          format: user.compression?.output?.format || defaults.compression.output.format,
          includeMetadata: user.compression?.output?.includeMetadata ?? defaults.compression.output.includeMetadata,
          generateReport: user.compression?.output?.generateReport ?? defaults.compression.output.generateReport,
          filenameTemplate: user.compression?.output?.filenameTemplate
        },
        validation: {
          minCoverage: user.compression?.validation?.minCoverage ?? defaults.compression.validation.minCoverage,
          minFidelity: user.compression?.validation?.minFidelity ?? defaults.compression.validation.minFidelity,
          failOnLowQuality: user.compression?.validation?.failOnLowQuality ?? defaults.compression.validation.failOnLowQuality
        },
        strategies: user.compression?.strategies || defaults.compression.strategies
      }
    };
  }

  /**
   * Get configuration value
   */
  get<K extends keyof Config>(key: K): Config[K] {
    return this.config[key];
  }

  /**
   * Get nested configuration value
   */
  getCompression(): Config['compression'] {
    return this.config.compression;
  }

  /**
   * Get default strategy
   */
  getDefaultStrategy(): string {
    return this.config.compression.defaultStrategy;
  }

  /**
   * Get compression level
   */
  getLevel(): 'light' | 'medium' | 'aggressive' {
    return this.config.compression.level;
  }

  /**
   * Get input patterns
   */
  getInputPatterns(): { include: string[]; exclude: string[] } {
    return {
      include: this.config.compression.input.include,
      exclude: this.config.compression.input.exclude
    };
  }

  /**
   * Get validation thresholds
   */
  getValidationThresholds(): { minCoverage: number; minFidelity: number } {
    return {
      minCoverage: this.config.compression.validation.minCoverage,
      minFidelity: this.config.compression.validation.minFidelity
    };
  }

  /**
   * Should generate report
   */
  shouldGenerateReport(): boolean {
    return this.config.compression.output.generateReport;
  }

  /**
   * Get output format
   */
  getOutputFormat(): 'yaml' | 'json' {
    return this.config.compression.output.format;
  }

  /**
   * Get config file path (if loaded from file)
   */
  getConfigPath(): string | undefined {
    return this.configPath;
  }

  /**
   * Export current config to YAML string
   */
  exportToYAML(): string {
    return YAML.stringify(this.config, {
      indent: 2,
      lineWidth: 80
    });
  }
}
