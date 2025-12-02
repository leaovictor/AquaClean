// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'service_package.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$ServicePackage {

 String get id; String get title; String get description; double get price; int get durationMinutes; String? get iconUrl; bool get isPopular;
/// Create a copy of ServicePackage
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ServicePackageCopyWith<ServicePackage> get copyWith => _$ServicePackageCopyWithImpl<ServicePackage>(this as ServicePackage, _$identity);

  /// Serializes this ServicePackage to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ServicePackage&&(identical(other.id, id) || other.id == id)&&(identical(other.title, title) || other.title == title)&&(identical(other.description, description) || other.description == description)&&(identical(other.price, price) || other.price == price)&&(identical(other.durationMinutes, durationMinutes) || other.durationMinutes == durationMinutes)&&(identical(other.iconUrl, iconUrl) || other.iconUrl == iconUrl)&&(identical(other.isPopular, isPopular) || other.isPopular == isPopular));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,title,description,price,durationMinutes,iconUrl,isPopular);

@override
String toString() {
  return 'ServicePackage(id: $id, title: $title, description: $description, price: $price, durationMinutes: $durationMinutes, iconUrl: $iconUrl, isPopular: $isPopular)';
}


}

/// @nodoc
abstract mixin class $ServicePackageCopyWith<$Res>  {
  factory $ServicePackageCopyWith(ServicePackage value, $Res Function(ServicePackage) _then) = _$ServicePackageCopyWithImpl;
@useResult
$Res call({
 String id, String title, String description, double price, int durationMinutes, String? iconUrl, bool isPopular
});




}
/// @nodoc
class _$ServicePackageCopyWithImpl<$Res>
    implements $ServicePackageCopyWith<$Res> {
  _$ServicePackageCopyWithImpl(this._self, this._then);

  final ServicePackage _self;
  final $Res Function(ServicePackage) _then;

/// Create a copy of ServicePackage
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? title = null,Object? description = null,Object? price = null,Object? durationMinutes = null,Object? iconUrl = freezed,Object? isPopular = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,description: null == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String,price: null == price ? _self.price : price // ignore: cast_nullable_to_non_nullable
as double,durationMinutes: null == durationMinutes ? _self.durationMinutes : durationMinutes // ignore: cast_nullable_to_non_nullable
as int,iconUrl: freezed == iconUrl ? _self.iconUrl : iconUrl // ignore: cast_nullable_to_non_nullable
as String?,isPopular: null == isPopular ? _self.isPopular : isPopular // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}

}


/// Adds pattern-matching-related methods to [ServicePackage].
extension ServicePackagePatterns on ServicePackage {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ServicePackage value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ServicePackage() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ServicePackage value)  $default,){
final _that = this;
switch (_that) {
case _ServicePackage():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ServicePackage value)?  $default,){
final _that = this;
switch (_that) {
case _ServicePackage() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String title,  String description,  double price,  int durationMinutes,  String? iconUrl,  bool isPopular)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ServicePackage() when $default != null:
return $default(_that.id,_that.title,_that.description,_that.price,_that.durationMinutes,_that.iconUrl,_that.isPopular);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String title,  String description,  double price,  int durationMinutes,  String? iconUrl,  bool isPopular)  $default,) {final _that = this;
switch (_that) {
case _ServicePackage():
return $default(_that.id,_that.title,_that.description,_that.price,_that.durationMinutes,_that.iconUrl,_that.isPopular);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String title,  String description,  double price,  int durationMinutes,  String? iconUrl,  bool isPopular)?  $default,) {final _that = this;
switch (_that) {
case _ServicePackage() when $default != null:
return $default(_that.id,_that.title,_that.description,_that.price,_that.durationMinutes,_that.iconUrl,_that.isPopular);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ServicePackage implements ServicePackage {
  const _ServicePackage({required this.id, required this.title, required this.description, required this.price, required this.durationMinutes, this.iconUrl, this.isPopular = false});
  factory _ServicePackage.fromJson(Map<String, dynamic> json) => _$ServicePackageFromJson(json);

@override final  String id;
@override final  String title;
@override final  String description;
@override final  double price;
@override final  int durationMinutes;
@override final  String? iconUrl;
@override@JsonKey() final  bool isPopular;

/// Create a copy of ServicePackage
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ServicePackageCopyWith<_ServicePackage> get copyWith => __$ServicePackageCopyWithImpl<_ServicePackage>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ServicePackageToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ServicePackage&&(identical(other.id, id) || other.id == id)&&(identical(other.title, title) || other.title == title)&&(identical(other.description, description) || other.description == description)&&(identical(other.price, price) || other.price == price)&&(identical(other.durationMinutes, durationMinutes) || other.durationMinutes == durationMinutes)&&(identical(other.iconUrl, iconUrl) || other.iconUrl == iconUrl)&&(identical(other.isPopular, isPopular) || other.isPopular == isPopular));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,title,description,price,durationMinutes,iconUrl,isPopular);

@override
String toString() {
  return 'ServicePackage(id: $id, title: $title, description: $description, price: $price, durationMinutes: $durationMinutes, iconUrl: $iconUrl, isPopular: $isPopular)';
}


}

/// @nodoc
abstract mixin class _$ServicePackageCopyWith<$Res> implements $ServicePackageCopyWith<$Res> {
  factory _$ServicePackageCopyWith(_ServicePackage value, $Res Function(_ServicePackage) _then) = __$ServicePackageCopyWithImpl;
@override @useResult
$Res call({
 String id, String title, String description, double price, int durationMinutes, String? iconUrl, bool isPopular
});




}
/// @nodoc
class __$ServicePackageCopyWithImpl<$Res>
    implements _$ServicePackageCopyWith<$Res> {
  __$ServicePackageCopyWithImpl(this._self, this._then);

  final _ServicePackage _self;
  final $Res Function(_ServicePackage) _then;

/// Create a copy of ServicePackage
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? title = null,Object? description = null,Object? price = null,Object? durationMinutes = null,Object? iconUrl = freezed,Object? isPopular = null,}) {
  return _then(_ServicePackage(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,description: null == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String,price: null == price ? _self.price : price // ignore: cast_nullable_to_non_nullable
as double,durationMinutes: null == durationMinutes ? _self.durationMinutes : durationMinutes // ignore: cast_nullable_to_non_nullable
as int,iconUrl: freezed == iconUrl ? _self.iconUrl : iconUrl // ignore: cast_nullable_to_non_nullable
as String?,isPopular: null == isPopular ? _self.isPopular : isPopular // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}


}

// dart format on
