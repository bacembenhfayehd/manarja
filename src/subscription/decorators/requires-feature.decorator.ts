// decorators/requires-feature.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const REQUIRES_FEATURE_KEY = 'requires-feature';

export const RequiresFeature = (feature: string) => SetMetadata(REQUIRES_FEATURE_KEY, feature);

// Exemple d'utilisation:
// @RequiresFeature('3D_VISUALIZATION')
// @RequiresFeature('ADVANCED_REPORTS')