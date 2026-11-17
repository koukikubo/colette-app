require "rails_helper"

RSpec.describe "画像処理の実行依存" do
  it "Railsで使うVipsエンジンで画像を変換できる" do
    require "image_processing/vips"
    image = Vips::Image.black(2, 2)
    result = ImageProcessing::Vips.source(image).resize_to_limit(1, 1).call
    begin
      resized = Vips::Image.new_from_file(result.path)
      expect([ resized.width, resized.height ]).to eq([ 1, 1 ])
    ensure
      result.close!
    end
  end
end
