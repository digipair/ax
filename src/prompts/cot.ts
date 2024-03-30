import { Generate, GenerateOptions } from '../dsp/generate.js';
import { GenIn, GenOut } from '../dsp/program.js';
import { Signature } from '../dsp/sig.js';
import type { AIService } from '../text/types.js';

export class ChainOfThought<
  IN extends GenIn = GenIn,
  OUT extends GenOut = GenOut
> extends Generate<IN, OUT & { reason: string }> {
  constructor(
    ai: AIService,
    signature: Readonly<Signature | string>,
    options?: Readonly<GenerateOptions>
  ) {
    super(ai, signature, options);
    this.updateSignature(this.updateSig);
  }

  private updateSig = (sig: Readonly<Signature>) => {
    const outputs = sig
      .getOutputFields()
      .map((f) => `\`${f.name}\``)
      .join(', ');

    const description = `Let's think step by step in order to produce ${outputs}. We ...`;

    sig.setOutputFields([
      {
        name: 'reason',
        description
      },
      ...sig.getOutputFields()
    ]);
  };
}
