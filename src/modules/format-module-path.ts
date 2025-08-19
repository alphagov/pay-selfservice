import { BaseModuleConstructor } from "@root/modules/app-module";
import { formattedPathFor } from "@utils/simplified-account/format/format-path";

export function formatModulePath (module: BaseModuleConstructor, ...params: string[]): string {
  return formattedPathFor(module.path!, ...params)
}

