import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const specPath = path.join(__dirname, '../../openapi/openapi.yaml');
const spec = YAML.parse(readFileSync(specPath, 'utf8'));

const router = Router();

router.use(swaggerUi.serve);
router.get('/', swaggerUi.setup(spec, { customSiteTitle: 'Finance API' }));

export default router;
