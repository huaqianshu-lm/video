import Foundation
import CoreGraphics
import CoreText
let args = CommandLine.arguments
let data = try Data(contentsOf: URL(fileURLWithPath: args[1]))
let provider = CGDataProvider(data: data as CFData)!
let cgFont = CGFont(provider)!
var output: [[String: Any]] = []
for (i, char) in Array("从输入到结果").enumerated() {
 let size: CGFloat = (i == 0 || i == 3) ? 136 : 176
 let font = CTFontCreateWithGraphicsFont(cgFont, size, nil, nil)
 var code = Array(String(char).utf16)[0]
 var glyph: CGGlyph = 0
 guard CTFontGetGlyphsForCharacters(font, &code, &glyph, 1), glyph != 0,
       let path = CTFontCreatePathForGlyph(font, glyph, nil) else { fatalError("Missing glyph") }
 var d = ""
 path.applyWithBlock { item in
  let e = item.pointee, p = e.points
  switch e.type {
   case .moveToPoint: d += "M\(p[0].x) \(p[0].y)"
   case .addLineToPoint: d += "L\(p[0].x) \(p[0].y)"
   case .addQuadCurveToPoint: d += "Q\(p[0].x) \(p[0].y) \(p[1].x) \(p[1].y)"
   case .addCurveToPoint: d += "C\(p[0].x) \(p[0].y) \(p[1].x) \(p[1].y) \(p[2].x) \(p[2].y)"
   case .closeSubpath: d += "Z"
   @unknown default: fatalError("Unknown path command")
  }
 }
 let box = path.boundingBoxOfPath
 output.append(["char": String(char), "d": d, "minX": box.minX, "width": box.width, "size": size, "minY": box.minY, "height": box.height])
}
try JSONSerialization.data(withJSONObject: output, options: [.prettyPrinted, .sortedKeys]).write(to: URL(fileURLWithPath: args[2]))
