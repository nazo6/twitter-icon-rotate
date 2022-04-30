import { TwitterApi } from "twitter-api-v2";
import sharp from "sharp";
import fetch from "node-fetch";
import { writeFile } from "fs/promises";
import path from "path";

import { config } from "dotenv";
config();

const opt = process.argv[2] ?? "";
let angle = 2;
if (!isNaN(parseInt(opt))) {
  angle = parseInt(opt);
}
console.log("Rotate angle: " + angle);

const main = async () => {
  let twitterApi = new TwitterApi({
    appKey: process.env.APP_KEY!,
    appSecret: process.env.APP_SECRET!,
    accessToken: process.env.ACCESS_TOKEN!,
    accessSecret: process.env.ACCEESS_SECRET!,
  });

  const account_info = await twitterApi.currentUser();

  let old_image_url: string = account_info.profile_image_url_https;
  old_image_url = old_image_url.replace("_normal", "");
  const old_image_bin = new Uint8Array(
    await (await fetch(old_image_url)).arrayBuffer(),
  );
  const old_image = sharp(old_image_bin);
  const old_width = (await old_image.metadata()).width!;
  const old_height = (await old_image.metadata()).height!;

  let rotated_image = old_image.rotate(angle);
  let rotated_image_orig = sharp(await rotated_image.toBuffer());
  const new_width = (await rotated_image_orig.metadata()).width!;
  const new_height = (await rotated_image_orig.metadata()).height!;

  const opts = {
    left: Math.round((new_width - old_width) / 2),
    top: Math.round((new_height - old_height) / 2),
    width: old_width,
    height: old_height,
  };

  const new_image = await rotated_image.extract(opts).toBuffer();

  await writeFile(path.join(__dirname, "./a.png"), new_image);

  await twitterApi.v1.updateAccountProfileImage(new_image);
};

main();
