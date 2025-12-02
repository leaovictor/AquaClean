// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'availability.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$Availability {

 String get date;// YYYY-MM-DD
 bool get isOpen; Map<String, int> get slots;
/// Create a copy of Availability
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$AvailabilityCopyWith<Availability> get copyWith => _$AvailabilityCopyWithImpl<Availability>(this as Availability, _$identity);

  /// Serializes this Availability to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is Availability&&(identical(other.date, date) || other.date == date)&&(identical(other.isOpen, isOpen) || other.isOpen == isOpen)&&const DeepCollectionEquality().equals(other.slots, slots));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,date,isOpen,const DeepCollectionEquality().hash(slots));

@override
String toString() {
  return 'Availability(date: $date, isOpen: $isOpen, slots: $slots)';
}


}

/// @nodoc
abstract mixin class $AvailabilityCopyWith<$Res>  {
  factory $AvailabilityCopyWith(Availability value, $Res Function(Availability) _then) = _$AvailabilityCopyWithImpl;
@useResult
$Res call({
 String date, bool isOpen, Map<String, int> slots
});




}
/// @nodoc
class _$AvailabilityCopyWithImpl<$Res>
    implements $AvailabilityCopyWith<$Res> {
  _$AvailabilityCopyWithImpl(this._self, this._then);

  final Availability _self;
  final $Res Function(Availability) _then;

/// Create a copy of Availability
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? date = null,Object? isOpen = null,Object? slots = null,}) {
  return _then(_self.copyWith(
date: null == date ? _self.date : date // ignore: cast_nullable_to_non_nullable
as String,isOpen: null == isOpen ? _self.isOpen : isOpen // ignore: cast_nullable_to_non_nullable
as bool,slots: null == slots ? _self.slots : slots // ignore: cast_nullable_to_non_nullable
as Map<String, int>,
  ));
}

}


/// Adds pattern-matching-related methods to [Availability].
extension AvailabilityPatterns on Availability {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _Availability value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _Availability() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _Availability value)  $default,){
final _that = this;
switch (_that) {
case _Availability():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _Availability value)?  $default,){
final _that = this;
switch (_that) {
case _Availability() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String date,  bool isOpen,  Map<String, int> slots)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _Availability() when $default != null:
return $default(_that.date,_that.isOpen,_that.slots);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String date,  bool isOpen,  Map<String, int> slots)  $default,) {final _that = this;
switch (_that) {
case _Availability():
return $default(_that.date,_that.isOpen,_that.slots);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String date,  bool isOpen,  Map<String, int> slots)?  $default,) {final _that = this;
switch (_that) {
case _Availability() when $default != null:
return $default(_that.date,_that.isOpen,_that.slots);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _Availability implements Availability {
  const _Availability({required this.date, required this.isOpen, required final  Map<String, int> slots}): _slots = slots;
  factory _Availability.fromJson(Map<String, dynamic> json) => _$AvailabilityFromJson(json);

@override final  String date;
// YYYY-MM-DD
@override final  bool isOpen;
 final  Map<String, int> _slots;
@override Map<String, int> get slots {
  if (_slots is EqualUnmodifiableMapView) return _slots;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableMapView(_slots);
}


/// Create a copy of Availability
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$AvailabilityCopyWith<_Availability> get copyWith => __$AvailabilityCopyWithImpl<_Availability>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$AvailabilityToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _Availability&&(identical(other.date, date) || other.date == date)&&(identical(other.isOpen, isOpen) || other.isOpen == isOpen)&&const DeepCollectionEquality().equals(other._slots, _slots));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,date,isOpen,const DeepCollectionEquality().hash(_slots));

@override
String toString() {
  return 'Availability(date: $date, isOpen: $isOpen, slots: $slots)';
}


}

/// @nodoc
abstract mixin class _$AvailabilityCopyWith<$Res> implements $AvailabilityCopyWith<$Res> {
  factory _$AvailabilityCopyWith(_Availability value, $Res Function(_Availability) _then) = __$AvailabilityCopyWithImpl;
@override @useResult
$Res call({
 String date, bool isOpen, Map<String, int> slots
});




}
/// @nodoc
class __$AvailabilityCopyWithImpl<$Res>
    implements _$AvailabilityCopyWith<$Res> {
  __$AvailabilityCopyWithImpl(this._self, this._then);

  final _Availability _self;
  final $Res Function(_Availability) _then;

/// Create a copy of Availability
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? date = null,Object? isOpen = null,Object? slots = null,}) {
  return _then(_Availability(
date: null == date ? _self.date : date // ignore: cast_nullable_to_non_nullable
as String,isOpen: null == isOpen ? _self.isOpen : isOpen // ignore: cast_nullable_to_non_nullable
as bool,slots: null == slots ? _self._slots : slots // ignore: cast_nullable_to_non_nullable
as Map<String, int>,
  ));
}


}

// dart format on
