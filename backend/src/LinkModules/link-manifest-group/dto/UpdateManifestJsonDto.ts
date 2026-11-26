import { manifestOrigin } from '../../../enum/origins';

export class UpdateManifestJsonDto {
  id: number;

  json: any;

  origin: manifestOrigin;

  path: string;

  hash: string;
}
