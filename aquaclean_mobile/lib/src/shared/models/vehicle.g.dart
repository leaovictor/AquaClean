// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'vehicle.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_Vehicle _$VehicleFromJson(Map<String, dynamic> json) => _Vehicle(
  id: json['id'] as String,
  brand: json['brand'] as String? ?? '',
  model: json['model'] as String? ?? '',
  plate: json['plate'] as String? ?? '',
  color: json['color'] as String? ?? '',
  type: json['type'] as String? ?? 'sedan',
  photoUrl: json['photoUrl'] as String?,
);

Map<String, dynamic> _$VehicleToJson(_Vehicle instance) => <String, dynamic>{
  'id': instance.id,
  'brand': instance.brand,
  'model': instance.model,
  'plate': instance.plate,
  'color': instance.color,
  'type': instance.type,
  'photoUrl': instance.photoUrl,
};
