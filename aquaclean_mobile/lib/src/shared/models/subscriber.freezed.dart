// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'subscriber.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$Subscriber {

 String get id; String get userId; String get planId; DateTime get startDate; DateTime? get endDate; String get status;
/// Create a copy of Subscriber
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$SubscriberCopyWith<Subscriber> get copyWith => _$SubscriberCopyWithImpl<Subscriber>(this as Subscriber, _$identity);

  /// Serializes this Subscriber to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is Subscriber&&(identical(other.id, id) || other.id == id)&&(identical(other.userId, userId) || other.userId == userId)&&(identical(other.planId, planId) || other.planId == planId)&&(identical(other.startDate, startDate) || other.startDate == startDate)&&(identical(other.endDate, endDate) || other.endDate == endDate)&&(identical(other.status, status) || other.status == status));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,userId,planId,startDate,endDate,status);

@override
String toString() {
  return 'Subscriber(id: $id, userId: $userId, planId: $planId, startDate: $startDate, endDate: $endDate, status: $status)';
}


}

/// @nodoc
abstract mixin class $SubscriberCopyWith<$Res>  {
  factory $SubscriberCopyWith(Subscriber value, $Res Function(Subscriber) _then) = _$SubscriberCopyWithImpl;
@useResult
$Res call({
 String id, String userId, String planId, DateTime startDate, DateTime? endDate, String status
});




}
/// @nodoc
class _$SubscriberCopyWithImpl<$Res>
    implements $SubscriberCopyWith<$Res> {
  _$SubscriberCopyWithImpl(this._self, this._then);

  final Subscriber _self;
  final $Res Function(Subscriber) _then;

/// Create a copy of Subscriber
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? userId = null,Object? planId = null,Object? startDate = null,Object? endDate = freezed,Object? status = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,userId: null == userId ? _self.userId : userId // ignore: cast_nullable_to_non_nullable
as String,planId: null == planId ? _self.planId : planId // ignore: cast_nullable_to_non_nullable
as String,startDate: null == startDate ? _self.startDate : startDate // ignore: cast_nullable_to_non_nullable
as DateTime,endDate: freezed == endDate ? _self.endDate : endDate // ignore: cast_nullable_to_non_nullable
as DateTime?,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [Subscriber].
extension SubscriberPatterns on Subscriber {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _Subscriber value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _Subscriber() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _Subscriber value)  $default,){
final _that = this;
switch (_that) {
case _Subscriber():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _Subscriber value)?  $default,){
final _that = this;
switch (_that) {
case _Subscriber() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String userId,  String planId,  DateTime startDate,  DateTime? endDate,  String status)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _Subscriber() when $default != null:
return $default(_that.id,_that.userId,_that.planId,_that.startDate,_that.endDate,_that.status);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String userId,  String planId,  DateTime startDate,  DateTime? endDate,  String status)  $default,) {final _that = this;
switch (_that) {
case _Subscriber():
return $default(_that.id,_that.userId,_that.planId,_that.startDate,_that.endDate,_that.status);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String userId,  String planId,  DateTime startDate,  DateTime? endDate,  String status)?  $default,) {final _that = this;
switch (_that) {
case _Subscriber() when $default != null:
return $default(_that.id,_that.userId,_that.planId,_that.startDate,_that.endDate,_that.status);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _Subscriber implements Subscriber {
  const _Subscriber({required this.id, required this.userId, required this.planId, required this.startDate, this.endDate, required this.status});
  factory _Subscriber.fromJson(Map<String, dynamic> json) => _$SubscriberFromJson(json);

@override final  String id;
@override final  String userId;
@override final  String planId;
@override final  DateTime startDate;
@override final  DateTime? endDate;
@override final  String status;

/// Create a copy of Subscriber
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$SubscriberCopyWith<_Subscriber> get copyWith => __$SubscriberCopyWithImpl<_Subscriber>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$SubscriberToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _Subscriber&&(identical(other.id, id) || other.id == id)&&(identical(other.userId, userId) || other.userId == userId)&&(identical(other.planId, planId) || other.planId == planId)&&(identical(other.startDate, startDate) || other.startDate == startDate)&&(identical(other.endDate, endDate) || other.endDate == endDate)&&(identical(other.status, status) || other.status == status));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,userId,planId,startDate,endDate,status);

@override
String toString() {
  return 'Subscriber(id: $id, userId: $userId, planId: $planId, startDate: $startDate, endDate: $endDate, status: $status)';
}


}

/// @nodoc
abstract mixin class _$SubscriberCopyWith<$Res> implements $SubscriberCopyWith<$Res> {
  factory _$SubscriberCopyWith(_Subscriber value, $Res Function(_Subscriber) _then) = __$SubscriberCopyWithImpl;
@override @useResult
$Res call({
 String id, String userId, String planId, DateTime startDate, DateTime? endDate, String status
});




}
/// @nodoc
class __$SubscriberCopyWithImpl<$Res>
    implements _$SubscriberCopyWith<$Res> {
  __$SubscriberCopyWithImpl(this._self, this._then);

  final _Subscriber _self;
  final $Res Function(_Subscriber) _then;

/// Create a copy of Subscriber
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? userId = null,Object? planId = null,Object? startDate = null,Object? endDate = freezed,Object? status = null,}) {
  return _then(_Subscriber(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,userId: null == userId ? _self.userId : userId // ignore: cast_nullable_to_non_nullable
as String,planId: null == planId ? _self.planId : planId // ignore: cast_nullable_to_non_nullable
as String,startDate: null == startDate ? _self.startDate : startDate // ignore: cast_nullable_to_non_nullable
as DateTime,endDate: freezed == endDate ? _self.endDate : endDate // ignore: cast_nullable_to_non_nullable
as DateTime?,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}

// dart format on
