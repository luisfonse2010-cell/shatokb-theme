import {
  handlePhysicalProjectionGateway,
  PHYSICAL_PROJECTION_BINDING
} from '../../../../today/projection-gateway.mjs';

export async function onRequestGet(context) {
  return handlePhysicalProjectionGateway({
    request: context.request,
    binding: context.env?.[PHYSICAL_PROJECTION_BINDING]
  });
}

export async function onRequest(context) {
  return handlePhysicalProjectionGateway({
    request: context.request,
    binding: context.env?.[PHYSICAL_PROJECTION_BINDING]
  });
}
