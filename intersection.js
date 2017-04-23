function intersectSegmentSegment(a, b, c, d) {
  var s1x = b.x - a.x
  var s1y = b.y - a.y
  var s2x = d.x - c.x
  var s2y = d.y - c.y
  var denom = 1 / (s1x * s2y - s2x * s1y)
  var acx = a.x - c.x
  var acy = a.y - c.y
  var s = (s1x * acy - s1y * acx) * denom
  var t = (s2x * acy - s2y * acx) * denom

  if (0 <= s && s <= 1 && 0 <= t && t <= 1) {
    return new Vec2(a.x + t * s1x, a.y + t * s1y)
  }
  return null
}

// 直線 (a, b) と線分 (c, d) の交差。注意： b は単位ベクトル。
function intersectLineSegment(a, b, c, d) {
  var v1x = a.x - c.x
  var v1y = a.y - c.y
  var v2x = d.x - c.x
  var v2y = d.y - c.y
  var denom = b.x * v2y - b.y * v2x
  var t2 = (b.x * v1y - b.y * v1x) / denom

  if (t2 >= 0 && t2 <= 1) {
    return new Vec2(c.x + t2 * v2x, c.y + t2 * v2y)
  }
  return null
}

// 半直線 (a, b) と線分 (c, d) の交差。注意： b は単位ベクトル。
function intersectHalflineSegment(a, b, c, d) {
  var v1x = a.x - c.x
  var v1y = a.y - c.y
  var v2x = d.x - c.x
  var v2y = d.y - c.y
  var denom = 1 / (b.x * v2y - b.y * v2x)
  var t1 = (v2x * v1y - v2y * v1x) * denom
  var t2 = (b.x * v1y - b.y * v1x) * denom

  if (t1 >= 0 && t2 >= 0 && t2 <= 1) {
    return new Vec2(c.x + t2 * v2x, c.y + t2 * v2y)
  }
  return null
}

function intersectHalflinePolygon(halfline, polygon) {
  var end = polygon.vertices.length
  for (var i = 0; i < end; ++i) {
    var next = (i + 1) % end
    var intersection = intersectHalflineSegment(
      halfline.vertices[0],
      halfline.direction,
      polygon.vertices[i],
      polygon.vertices[next]
    )
    if (intersection !== null) {
      return intersection
    }
  }
  return null
}

// 点からの距離が最短となる直線上の点。
function nearestPointLine(point, lineA, lineB) {
  var ab = Vec2.sub(lineB, lineA)
  var pa = Vec2.sub(point, lineA)
  var dot = ab.dot(pa)
  var lengthsq = ab.lengthSq()
  var param = dot / lengthsq
  return Vec2.add(lineA, ab.mul(param))
}

// 点から線分への距離。
function distancePointSegment(point, lineA, lineB) {
  var ab = Vec2.sub(lineB, lineA)
  var pa = Vec2.sub(lineA, point)
  var dot = ab.dot(pa)
  var lengthsq = ab.lengthSq()
  var param = -1
  if (lengthsq <= 0) {
    param = dot / lengthsq
  }

  var nearest
  if (param < 0) {
    nearest = lineA
  }
  else if (param > 1) {
    nearest = lineB
  }
  else {
    nearest = Vec2.add(lineA, ab.mul(param))
  }

  return Vec2.sub(point, nearest).length()
}